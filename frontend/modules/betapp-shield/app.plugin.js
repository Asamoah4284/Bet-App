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

function withPacketTunnelXcodeProject(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const bundleId = config.ios?.bundleIdentifier || 'com.betapp.recovery';
    const developmentTeam = config.ios?.appleTeamId;
    const targetName = TUNNEL_NAME;

    const mainTarget = project.getFirstTarget();
    if (mainTarget?.uuid) {
      try {
        project.addFramework('NetworkExtension.framework', { target: mainTarget.uuid });
      } catch {
        // Already present.
      }
    }

    if (!project.pbxTargetByName(targetName)) {
      const target = project.addTarget(
        targetName,
        'app_extension',
        targetName,
        `${bundleId}${TUNNEL_BUNDLE_SUFFIX}`
      );

      project.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', target.uuid);
      project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', target.uuid);
      project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', target.uuid);

      // Embed App Extensions copy phase on the main app.
      if (mainTarget?.uuid) {
        project.addBuildPhase(
          [`${targetName}.appex`],
          'PBXCopyFilesBuildPhase',
          'Embed App Extensions',
          mainTarget.uuid,
          'app_extension'
        );
        try {
          project.addTargetDependency(mainTarget.uuid, [target.uuid]);
        } catch {
          // Ignore duplicate dependency errors.
        }
      }

      const groupKey = project.pbxCreateGroup(targetName, targetName);
      const mainGroupId = project.getFirstProject().firstProject.mainGroup;
      project.addToPbxGroup(groupKey, mainGroupId);

      project.addSourceFile(`${targetName}/PacketTunnelProvider.swift`, { target: target.uuid }, groupKey);
      project.addFile(`${targetName}/Info.plist`, groupKey);
      project.addFile(`${targetName}/${targetName}.entitlements`, groupKey);
    }

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
