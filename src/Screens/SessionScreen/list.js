import React, { useRef, useEffect } from 'react'
import {
  TouchableOpacity,
  Text,
  View,
  Image,
  Platform,
  PermissionsAndroid,
  Alert,
  Animated,
  Dimensions,
  ImageBackground
} from 'react-native'
import styles from './style'
import { useIntl } from 'react-intl'
import post from '../../utils/axios'
import style from './style'
function SessionList ({
  _engine,
  isJoined,
  langtit,
  lang,
  apptoken,
  session_code,
  setStartedToken,
  setStartedChannelId,
  stop,
  setisLoading,
  isLoading,
  setChannel_name,
  muteAudio,
  isMute
}) {
  const { messages } = useIntl()
  const value = useRef(new Animated.Value(0))
  let translateY = value.current.interpolate({
    inputRange: [0, 1],
    outputRange: [110, 0]
    // extrapolate : 'extend' | 'identity' | 'clamp',
    // extrapolateRight : 'extend' | 'identity' | 'clamp',
    // extrapolateLeft : 'extend' | 'identity' | 'clamp',
  })
  const ani = useRef(
    Animated.loop(
      Animated.timing(value.current, {
        duration: 5000,
        toValue: 1,
        delay: 200,
        useNativeDriver: true
      })
    )
  ).current
  useEffect(() => {
    if (isLoading) {
      ani.start()
    } else {
      ani.stop()
    }
  }, [isLoading])

  const start = async () => {
    setisLoading(true)
    let granted
    if (Platform.OS === 'android') {
      granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      )
    } else if (Platform.OS === 'ios') {
      const formdata = new FormData()
      formdata.append('set_lang', lang)
      formdata.append('session_code', session_code)
      formdata.append('app_token', apptoken)
      const result = await post('/api/trans_session_start.php', formdata)
      if (result.result == 'false') {
        setisLoading(false)
        console.log(result)
        return Alert.alert('', result.msg)
      } else {
        setisLoading(false)

        // await _engine?.joinChannel(result.data.token, session_code, null, 0);
        console.log(
          '여기로 오는지 확인 얘가 시작 데이터 IOS ?? ::: ',
          result.data
        )

        await _engine?.joinChannel(
          result.data.token,
          result.data.channel_name,
          null,
          0
        )
        setChannel_name(result.data.channel_name)
        setStartedToken(result.data.token)
        setStartedChannelId(session_code)
        return;
      }
    }

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      const formdata = new FormData()
      formdata.append('set_lang', lang)
      formdata.append('session_code', session_code)
      formdata.append('app_token', apptoken)

      console.log('send formdata ::', formdata)

      const result = await post('/api/trans_session_start.php', formdata)

      console.log('send result ::', result)

      if (result.result == 'false') {
        setisLoading(false)
        console.log(result)
        return Alert.alert('', result.msg)
      } else {
        console.log('여기로 오는지 확인 얘가 시작 데이터 ?? ::: ', result.data)

        // await _engine?.joinChannel(result.data.token, session_code, null, 0);
        await _engine?.joinChannel(
          result.data.token,
          result.data.channel_name,
          null,
          0
        )
        setChannel_name(result.data.channel_name)

        setStartedToken(result.data.token)
        setStartedChannelId(session_code)
      }
    } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
      setisLoading(false)
      return Alert.alert(
        '',
        lang === 'ko'
          ? '마이크 권한을 확인해주세요.'
          : 'Please check the microphone permission.'
      )
    } else {
      setisLoading(false)
      return Alert.alert(
        '',
        lang === 'ko'
          ? '마이크 권한을 확인해주세요.'
          : 'Please check the microphone permission.'
      )
    }
  }
  const getTransform = () => {
    return {
      transform: [{ translateY: translateY }]
    }
  };
  return (
    <View style={styles.playbox}>
      <Text style={styles.transtit}>{langtit}</Text>
      <View style={styles.transdes}>
        <Text style={[styles.transtext]}>{messages.sessionbtntxt}</Text>
        <Text style={[styles.transtext, { color: '#F35174' }]}>
          {messages.touch}
        </Text>
        <Text style={[styles.transtext]}>{messages.start}</Text>
      </View>
      {!isJoined ? (
        !isLoading ? (
          <TouchableOpacity onLongPress={() => start()}>
            <View>
              <Image
                source={require('../../assign/img/btn_play.png')}
                style={styles.playbtn}
                resizeMode='contain'
              />
            </View>
          </TouchableOpacity>
        ) : (
          <ImageBackground
            source={require('../../assign/img/btn_play.png')}
            style={styles.animationview}
            resizeMode='contain'
          >
            <View style={styles.overflowview}>
              <Animated.View
                style={[
                  {
                    width: 100,
                    height: 100,
                    backgroundColor: '#F35174',
                    opacity: Platform.OS == 'android' ? 0.7 : 0.9
                  },
                  getTransform()
                ]}
              />
            </View>
          </ImageBackground>
        )
      ) : !isLoading ? (
        <TouchableOpacity onLongPress={() => stop()}>
          <Image
            source={require('../../assign/img/btn_stop.png')}
            style={styles.playbtn}
            resizeMode='contain'
          />
        </TouchableOpacity>
      ) : (
        <ImageBackground
          source={require('../../assign/img/btn_stop.png')}
          style={styles.animationview}
          resizeMode='contain'
        >
          <View style={styles.overflowview}>
            <Animated.View
              style={[
                {
                  width: 100,
                  height: 100,
                  backgroundColor: '#F35174',
                  opacity: Platform.OS == 'android' ? 0.7 : 0.9
                },
                getTransform()
              ]}
            />
          </View>
        </ImageBackground>
      )}
      <View style={{ marginBottom: 20 }} />
      <TouchableOpacity
        onPress={muteAudio}
        style={{
          backgroundColor: isMute ? '#222' : '#aaa',
          padding: 5,
          borderRadius: 5
        }}
      >
        <Text style={{ fontWeight: 'bold', color: '#fff' }}>
          {isMute ? '음소거 해제' : '음소거 하기'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
export default SessionList
