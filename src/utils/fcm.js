import React from 'react';
import messaging from '@react-native-firebase/messaging';

export const getToken = async () => {
  try {
    const token = await requestUserPermissionForFCM();
    return token;
  } catch (e) {
    console.log(e);
  }
};

const requestUserPermissionForFCM = async () => {
  await messaging().requestPermission();
  const defaulttoken = await messaging().getToken();
  console.log('defaulttoken 111 :', defaulttoken);
  return defaulttoken;
};

export default getToken;
