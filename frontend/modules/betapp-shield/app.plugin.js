const fs = require('fs');
const path = require('path');
const {
  withDangerousMod,
  withEntitlementsPlist,
  withInfoPlist,
  withXcodeProject,
} = require('@expo/config-plugins');

const APP_GROUP = 'group.com.betapp.recovery.shield';
const TUNNEL_NAME = 'BetappShieldTunnel';
const TUNNEL_BUNDLE_SUFFIX = '.ShieldTunnel';

function ensureArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function unquote(value) {
  return String(value || '').replace(/^"|"$/g, '');
}

function withMainAppEntitlements(config) {
  return withEntitlementsPlist(config, (config) => {
    const entitlements = config.modResults;

    const ne = ensureArray(entitlements['com.apple.developer.networking.networkextension']);
    if (!ne.includes('packet-tunnel-provider')) {
      ne.push('packet-tunnel-provider');
    }
    entitlements['com.apple.developer.networking.networkextension'] = ne;

    const groups = ensureArray(entitlements['com.apple.security.application-groups']);
    if (!groups.includes(APP_GROUP)) {
      groups.push(APP_GROUP);
    }
    entitlements['com.apple.security.application-groups'] = groups;

    return config;
  });
}

function withMainAppInfoPlist(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.NSLocalNetworkUsageDescription =
      config.modResults.NSLocalNetworkUsageDescription ||
      'Betapp Shield uses a local on-device filter to block gambling websites.';
    return config;
  });
}

function withPacketTunnelFiles(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const targetDir = path.join(projectRoot, 'ios', TUNNEL_NAME);
      const sourceDir = path.join(projectRoot, 'modules', 'betapp-shield', 'ios', 'PacketTunnel');

      fs.mkdirSync(targetDir, { recursive: true });

      const copies = [
        ['PacketTunnelProvider.swift', 'PacketTunnelProvider.swift'],
        ['Info.plist', 'Info.plist'],
        ['PacketTunnel.entitlements', `${TUNNEL_NAME}.entitlements`],
      ];

      for (const [fromName, toName] of copies) {
        const from = path.join(sourceDir, fromName);
        if (!fs.existsSync(from)) {
          throw new Error(`Missing Shield tunnel source: ${from}`);
        }
        fs.copyFileSync(from, path.join(targetDir, toName));
      }

      return config;
    },
  ]);
}

function configureTunnelBuildSettings(project, targetName, bundleId, developmentTeam) {
  const configurations = project.pbxXCBuildConfigurationSection();
  const nativeTargets = project.pbxNativeTargetSection();

  Object.keys(nativeTargets).forEach((key) => {
    const nativeTarget = nativeTargets[key];
    if (typeof nativeTarget !== 'object') return;
    if (unquote(nativeTarget.name) !== targetName) return;

    const list = project.pbxXCConfigurationList()[nativeTarget.buildConfigurationList];
    if (!list?.buildConfigurations) return;

    list.buildConfigurations.forEach((entry) => {
      const buildConfig = configurations[entry.value];
      if (!buildConfig?.buildSettings) return;
      const settings = buildConfig.buildSettings;
      settings.PRODUCT_BUNDLE_IDENTIFIER = `${bundleId}${TUNNEL_BUNDLE_SUFFIX}`;
      settings.INFOPLIST_FILE = `${targetName}/Info.plist`;
      settings.CODE_SIGN_ENTITLEMENTS = `${targetName}/${targetName}.entitlements`;
      settings.SWIFT_VERSION = '5.0';
      settings.TARGETED_DEVICE_FAMILY = '"1,2"';
      settings.IPHONEOS_DEPLOYMENT_TARGET = settings.IPHONEOS_DEPLOYMENT_TARGET || '15.1';
      settings.GENERATE_INFOPLIST_FILE = 'NO';
      settings.SKIP_INSTALL = 'YES';
      settings.LD_RUNPATH_SEARCH_PATHS =
        '"$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"';
      settings.PRODUCT_NAME = `"${targetName}"`;
      settings.CODE_SIGN_STYLE = 'Automatic';
      if (developmentTeam) {
        settings.DEVELOPMENT_TEAM = developmentTeam;
      }
    });
  });
}

function ensurePbxSections(project) {
  // node-xcode's addTarget assumes these exist; fresh Expo projects often don't.
  const objects = project.hash.project.objects;
  objects.PBXTargetDependency = objects.PBXTargetDependency || {};
  objects.PBXContainerItemProxy = objects.PBXContainerItemProxy || {};
}

function ensureAppexInProductsGroup(project, targetName) {
  const products = project.pbxGroupByName('Products');
  if (!products?.children) return;

  const fileRefs = project.pbxFileReferenceSection();
  const appexName = `${targetName}.appex`;
  let appexUuid = null;

  Object.keys(fileRefs).forEach((key) => {
    if (key.endsWith('_comment')) return;
    const ref = fileRefs[key];
    if (!ref || typeof ref !== 'object') return;
    const pathName = unquote(ref.path || ref.name || '');
    if (pathName === appexName) {
      appexUuid = key;
    }
  });

  if (!appexUuid) return;

  const alreadyChild = products.children.some((child) => child.value === appexUuid);
  if (!alreadyChild) {
    products.children.push({ value: appexUuid, comment: appexName });
  }
}

function withPacketTunnelXcodeProject(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const bundleId = config.ios?.bundleIdentifier || 'com.betapp.recovery';
    const developmentTeam = config.ios?.appleTeamId;
    const targetName = TUNNEL_NAME;
    const sourceFiles = ['PacketTunnelProvider.swift'];
    const configFiles = ['Info.plist', `${targetName}.entitlements`];

    const mainTarget = project.getFirstTarget();
    if (mainTarget?.uuid) {
      try {
        project.addFramework('NetworkExtension.framework', { target: mainTarget.uuid });
      } catch {
        // Already present.
      }
    }

    if (!project.pbxTargetByName(targetName)) {
      ensurePbxSections(project);

      // Create the group + file refs before addTarget (OneSignal / expo-share-intent style).
      const extGroup = project.addPbxGroup(
        [...sourceFiles, ...configFiles],
        targetName,
        targetName
      );

      const groups = project.hash.project.objects.PBXGroup;
      Object.keys(groups).forEach((key) => {
        const group = groups[key];
        if (typeof group !== 'object' || !group) return;
        // Root project group has neither name nor path.
        if (group.name === undefined && group.path === undefined) {
          project.addToPbxGroup(extGroup.uuid, key);
        }
      });

      // addTarget already creates the product + Embed/Copy Files phase on the main app.
      // Do NOT add a second Embed App Extensions phase — that orphans the .appex ref and
      // breaks CocoaPods post_install (xcodeproj "no parent for object …appex").
      const target = project.addTarget(
        targetName,
        'app_extension',
        targetName,
        `${bundleId}${TUNNEL_BUNDLE_SUFFIX}`
      );

      project.addBuildPhase(sourceFiles, 'PBXSourcesBuildPhase', 'Sources', target.uuid);
      project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', target.uuid);
      project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);

    }

    // Always re-parent the product file — CocoaPods post_install crashes if the
    // .appex PBXFileReference is not in a PBXGroup (Products).
    ensureAppexInProductsGroup(project, targetName);
    configureTunnelBuildSettings(project, targetName, bundleId, developmentTeam);
    return config;
  });
}

function withBetappShield(config) {
  config = withMainAppEntitlements(config);
  config = withMainAppInfoPlist(config);
  config = withPacketTunnelFiles(config);
  config = withPacketTunnelXcodeProject(config);
  return config;
}

module.exports = withBetappShield;
