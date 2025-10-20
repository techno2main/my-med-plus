import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.myhealthplus.app',
  appName: 'MyHealthPlus',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff',
    },
  },
};

export default config;
