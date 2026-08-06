import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { BackHeader } from '../components/BackHeader';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useProfileStore } from '../store/profileStore';
import { useToastStore } from '../store/toastStore';
import { validateDisplayName, validateUsername } from '../utils/validation';

export function EditProfileScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const apiError = useAuthStore((state) => state.error);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const clearError = useAuthStore((state) => state.clearError);
  const avatarUri = useProfileStore((state) => state.avatarUri);
  const hydrateProfile = useProfileStore((state) => state.hydrate);
  const saveAvatar = useProfileStore((state) => state.saveAvatar);
  const showToast = useToastStore((state) => state.show);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    hydrateProfile();
  }, [hydrateProfile]);

  useEffect(() => {
    if (!saved) return undefined;
    const timer = setTimeout(() => setSaved(false), 4500);
    return () => clearTimeout(timer);
  }, [saved]);

  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo permission needed', 'Allow photo access to choose a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      await saveAvatar(result.assets[0].uri);
    }
  };

  const save = async () => {
    clearError();
    setSaved(false);
    const nextErrors = {
      displayName: validateDisplayName(displayName),
      username: validateUsername(username),
      bio: bio.trim().length > 160 ? 'Bio must be 160 characters or fewer' : null,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    try {
      await updateProfile({
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
      });
      setSaved(true);
      showToast({
        title: 'Profile updated',
        body: 'Your changes have been saved.',
        icon: 'checkmark-circle',
        tint: 'success',
      });
    } catch {
      // Store displays the API error.
    }
  };

  return (
    <Screen scroll>
      <BackHeader title="Edit profile" />

      <View style={styles.avatarSection}>
        <Pressable onPress={choosePhoto} style={styles.avatarPressable}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarFallback,
                { backgroundColor: theme.colors.primaryMuted },
              ]}
            >
              <Text style={[styles.avatarInitial, { color: theme.colors.primary }]}>
                {(user?.displayName || 'F')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={[styles.cameraBadge, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </View>
        </Pressable>
        <Button label="Change photo" variant="ghost" onPress={choosePhoto} style={styles.photoButton} />
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, textAlign: 'center' }]}>
          Your photo stays on this device and is not shown on leaderboards.
        </Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="Display name"
          icon="person-outline"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="How should we greet you?"
          autoCapitalize="words"
          error={errors.displayName}
        />
        <TextField
          label="Username"
          icon="at-outline"
          value={username}
          onChangeText={setUsername}
          placeholder="Optional username"
          error={errors.username}
        />
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 6 }]}>
          Bio
        </Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="A short note about what you're working toward..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={160}
          style={[
            styles.bio,
            theme.typography.body,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.surface,
              borderColor: errors.bio ? theme.colors.danger : theme.colors.border,
              borderRadius: theme.radii.md,
            },
          ]}
        />
        <Text style={[theme.typography.caption, styles.counter, { color: theme.colors.textSecondary }]}>
          {bio.length}/160
        </Text>
        {errors.bio ? (
          <Text style={[theme.typography.caption, { color: theme.colors.danger }]}>{errors.bio}</Text>
        ) : null}

        {apiError ? (
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: theme.colors.dangerMuted,
                borderColor: theme.colors.danger,
              },
            ]}
          >
            <Ionicons name="alert-circle" size={20} color={theme.colors.danger} />
            <Text style={[theme.typography.body, styles.statusText, { color: theme.colors.danger }]}>
              {apiError}
            </Text>
          </View>
        ) : null}

        {saved ? (
          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: theme.colors.successMuted,
                borderColor: theme.colors.success,
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={22} color={theme.colors.success} />
            <View style={styles.statusCopy}>
              <Text
                style={[
                  theme.typography.subtitle,
                  { color: theme.colors.success, fontFamily: theme.fonts.bodyBold },
                ]}
              >
                Profile updated
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
                Your changes have been saved.
              </Text>
            </View>
          </View>
        ) : null}

        <Button label="Save changes" onPress={save} loading={loading} style={styles.saveButton} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
  },
  avatarPressable: {
    position: 'relative',
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    right: 1,
    bottom: 3,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  photoButton: {
    minHeight: 40,
    marginTop: 8,
  },
  form: {
    marginTop: 28,
    paddingBottom: 20,
  },
  bio: {
    minHeight: 100,
    borderWidth: 1,
    padding: 14,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  statusBanner: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusCopy: {
    flex: 1,
  },
  statusText: {
    flex: 1,
  },
  saveButton: {
    marginTop: 18,
  },
});
