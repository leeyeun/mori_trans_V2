import React, { useState, useEffect, useRef } from 'react'
import {
  TouchableOpacity,
  Text,
  SafeAreaView,
  View,
  Alert,
  ImageBackground,
  ScrollView,
  PermissionsAndroid,
  DeviceEventEmitter,
  Platform,
  Dimensions,
  AppState
} from 'react-native'
import RtcEngine, {
  ChannelProfile,
  ClientRole,
  RtcEngineConfig
} from 'react-native-agora'
import styles from './style'
import { useIntl } from 'react-intl'
// import CallState from '@remobile/react-native-call-state'
import Header from '../../Components/headers'
import List from './list'
import Sound from './sound'
import DataList from './datalist'
import Duration from './duration'
import config from '../../../agora.config.json'
import { useSelector, useDispatch } from 'react-redux'
import post from '../../utils/axios'
import ReactNativeForegroundService from '@supersami/rn-foreground-service'
import { set_check, set_end_check } from '../../redux/actions/loginAction'

let _engine
let _device
let joincheck = false
let check = false
const defaulturl = 'https://change-all.com'
function SessionScreen ({ navigation, route }) {
  const lang = useSelector(state => state.LangsReducer.langs)
  const apptoken = useSelector(state => state.LoginReducer.apptoken)
  const startcheck = useSelector(state => state.LoginReducer.check)
  const endcheck = useSelector(state => state.LoginReducer.endcheck)
  const dispatch = useDispatch()
  const { messages } = useIntl()
  const [tabactive, setTabactive] = useState('translate')
  const [getEngine, setGetEngine] = useState(false)
  const [isJoined, setisJoined] = useState(false)
  const [isLoading, setisLoading] = useState(false)
  const [channel_name, setChannel_name] = useState(null)
  const [isMute, setMute] = useState(false)

  // const [isJoinedCheck, setisJoinedCheck] = useState(false);
  const [volume, setVolume] = useState(0)
  const [sessiondata, setSessionData] = useState({})
  const [startedChannelId, setStartedChannelId] = useState('')
  const [startedToken, setStartedToken] = useState('')
  const [duration, setDuration] = useState(0)
  useEffect(() => {
    async function getSessionDetail () {
      const formdata = new FormData()
      formdata.append('set_lang', lang)
      formdata.append('session_code', route.params.sessiondata?.session_code)

      console.log('formdata ??', formdata)

      const result = await post('/api/trans_session_detail.php', formdata)
      if (result.result == 'false') {
        return Alert.alert('', result.msg)
      } else {
        if (result.data?.filelist.length > 0) {
          for (const file in result.data.filelist) {
            result.data.filelist[file].file_link =
              defaulturl + result.data.filelist[file].file_link.substring(2)
          }
        }
        if (result.data?.img) {
          if (result.data.img.indexOf('https://') === -1) {
            result.data.img = defaulturl + result.data.img.substring(2)
          }
        }
        console.log(result)
        setSessionData(result.data)
      }
    }

    initEngine()
    // if (Platform.OS === 'android') CallState.startListener()
    // _device = DeviceEventEmitter.addListener('callStateUpdated', data => {
    //   if (data) {
    //     callcheck(data.state)
    //   }
    // })

    getSessionDetail()
    return () => {
      async function agoraRemove () {
        await stop()
      }
      agoraRemove()
      _engine?.destroy()
      // if (Platform.OS === 'android') CallState.stopListener()
    };
  }, [])
  //수정해야 될 부분 20211119 인터벌 처리
  // async function check2() {
  //   const formdata = new FormData();
  //   formdata.append('set_lang', lang);
  //   formdata.append('session_code', route.params.sessiondata?.session_code);
  //   formdata.append('app_token', apptoken);
  //   const result = await post('/api/trans_ing_check.php', formdata);
  //   if (result.result == 'false') {
  //     return Alert.alert('', result.msg);
  //   } else {
  //     dispatch(set_check({check: false}));
  //   }
  // }
  // useEffect(() => {
  //   if (startcheck) {
  //     if (isJoined) {
  //       check2();
  //     }
  //   }
  // }, [startcheck]);
  async function check () {
    console.log('함수 확인 ')
    const formdata = new FormData()
    formdata.append('set_lang', lang)
    formdata.append('session_code', route.params.sessiondata?.session_code)
    formdata.append('app_token', apptoken)
    formdata.append('channel_name', channel_name)
    console.log('formData  ::: ', formdata)
    const result = await post('/api/trans_ing_interval.php', formdata)
    if (result.result == 'false') {
      stop()
      return Alert.alert('', result.msg)
    } else {
      dispatch(set_check({ check: false }))
    }
  }

  useEffect(() => {
    const interval =
      channel_name !== null &&
      setInterval(() => {
        console.log('체크가 바뀌고 몇번 도는가 ')
        check()
      }, 10000)

    return () => clearInterval(interval)
  }, [channel_name])

  // useEffect(() => {
  //     if (startcheck) {
  //     if (isJoined) {
  //       check();
  //     }
  //   }
  // }, [startcheck]);

  useEffect(() => {
    async function leave () {
      await _engine?.leaveChannel()
      setDuration(0)
      if (Platform.OS === 'android') {
        if (ReactNativeForegroundService.is_task_running('agora')) {
          ReactNativeForegroundService.remove_task('agora')
        }
        // Stoping Foreground service.
        ReactNativeForegroundService.stop()
        setChannel_name(null)
      }
    }
    if (endcheck) {
      dispatch(set_end_check({ endcheck: false }))
      leave()
    }
  }, [endcheck])

  // console.log('endcheck??', endcheck)

  const stop = async () => {
    setisLoading(true)
    if (joincheck) {
      console.log(505055050)
      if (Platform.OS === 'android') {
        if (ReactNativeForegroundService.is_task_running('agora')) {
          ReactNativeForegroundService.remove_task('agora')
        }
        // Stoping Foreground service.
        ReactNativeForegroundService.stop()
        setChannel_name(null)
      }
      setChannel_name(null)
      await _engine?.leaveChannel()
      const formdata = new FormData()
      formdata.append('set_lang', lang)
      formdata.append('session_code', route.params.sessiondata?.session_code)
      formdata.append('app_token', apptoken)

      console.log('end formdata ::', formdata)

      const result = await post('/api/trans_session_end.php', formdata)

      console.log('end result ::', result)

      if (result.result == 'false') {
        setisLoading(false)
        return Alert.alert('', result.msg)
      } else {
        setDuration(0)
        setisJoined(false)
        setisLoading(false)
        setStartedChannelId('')
        setStartedToken('')
      }
    }
  }

  const callcheck = async state => {
    if (state == 'Connected') {
      await _engine?.leaveChannel()
      check = true
      // await _engine.disableAudio();
    } else if (state == 'Incoming' || state == 'Disconnected') {
      if (check) {
        check = false
        setTimeout(async () => {
          if (Platform.OS === 'android') {
            await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
            )
          }
          await _engine?.joinChannel(startedToken, startedChannelId, null, 0)
        }, 1000)
      }
    }
  }
  // useInterval(()=>{
  //     setDuration(duration+1);
  // },isJoined?1000:null)
  // useEffect(() => {
  //         if(isJoinedCheck){
  //             tick = setTimeout(() => {
  //                 setisJoinedCheck(false)
  //                 Alert.alert('',messages.agoraerror);
  //             }, 2000);
  //         }
  // }, [isJoinedCheck,setisJoined])
  const initEngine = async () => {
    _engine = await RtcEngine.createWithConfig(
      new RtcEngineConfig(config.appId)
    )
    await addListeners(_engine)
    await _engine.enableAudio()
    await _engine.enableAudioVolumeIndication(300, 3, true)
    await _engine.setChannelProfile(ChannelProfile.LiveBroadcasting)
    await _engine.setClientRole(ClientRole.Broadcaster)
    await _engine.setParameters('{"che.audio.opensl":true}')
    setGetEngine(true)
  };

  // 음소거
  const muteAudio = async () => {
    console.log('음소거')
    if (isMute) {
      await _engine.muteLocalAudioStream(false)
      setMute(false)
    } else {
      await _engine.muteLocalAudioStream(true)
      setMute(true)
    }
  }

  const addListeners = _engine => {
    _engine?.addListener('JoinChannelSuccess', (channel, uid, elapsed) => {
      console.info('JoinChannelSuccess', channel, uid, elapsed)
      setisJoined(true)
      setisLoading(false)
      joincheck = true
      if (Platform.OS === 'android') {
        if (ReactNativeForegroundService.is_task_running('agora')) return
        ReactNativeForegroundService.add_task(
          () => console.log('I am Being Tested'),
          {
            delay: 10000,
            onLoop: true,
            taskId: 'agora',
            onError: e => console.log('Error logging:', e)
          }
        )
        // starting  foreground service.
        ReactNativeForegroundService.start({
          id: 144,
          title: messages.translatestart,
          message: messages.translatestart
        })
      }
      // setisJoinedCheck(false)
      // clearTimeout(tick);
    })

    _engine?.addListener('LeaveChannel', stats => {
      console.info('LeaveChannel', stats)
      setisJoined(false)
      joincheck = false
      if (Platform.OS === 'android') {
        if (ReactNativeForegroundService.is_task_running('agora')) {
          ReactNativeForegroundService.remove_task('agora')
        }
        // Stoping Foreground service.
        ReactNativeForegroundService.stop()
      }
    })
    _engine?.addListener('AudioVolumeIndication', stats => {
      if (stats && stats.length > 0) {
        setVolume(parseInt(stats[0].volume))
      }
    })
    _engine?.addListener('RtcStats', state => {
      if (AppState.currentState == 'background') {
        if (state) {
          setDuration(state?.duration)
        }
      }
    })
  };
  const micmute = () => {
    _engine?.enableLocalAudio(false)
  };

  console.log('sessiondata ?', sessiondata)
  console.log('sessiondata.img ?', sessiondata.img)

  return sessiondata ? (
    <SafeAreaView style={styles.container}>
      {isLoading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            flex: 1,
            height: Dimensions.get('window').height,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
            elevation: 0,
            backgroundColor: 'rgba(255,255,255,0.6)'
          }}
        >
        </View>
      )}
      <Header title={messages.session} navigation={navigation} />
      <View style={styles.content}>
        <ImageBackground
          source={{ uri: sessiondata.img ? sessiondata.img : null }}
          resizeMode='cover'
          style={{ ...styles.image, backgroundColor: '#000', borderRadius: 10 }}
          imageStyle={{
            borderRadius: 10,
            opacity: 0.8,
            backgroundColor: sessiondata.img ? 'transparent' : '#000'
          }}
        >
          <ScrollView contentContainerStyle={styles.conferbox}>
            <Text style={styles.title}>{sessiondata.title}</Text>
            <Text style={styles.des}>{sessiondata.content}</Text>
          </ScrollView>
        </ImageBackground>
      </View>
      <View style={styles.sessionbox}>
        <View style={styles.sessionheader}>
          <TouchableOpacity
            style={styles.tabbtn}
            onPress={() => setTabactive('translate')}
          >
            <View />
            <Text
              style={
                tabactive == 'translate' ? styles.tabactivetext : styles.tabtext
              }
            >
              {messages.translate}
            </Text>
            <View style={tabactive == 'translate' && styles.activetab} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabbtn}
            onPress={() => setTabactive('databox')}
          >
            <View />
            <Text
              style={
                tabactive == 'databox' ? styles.tabactivetext : styles.tabtext
              }
            >
              {messages.databox}
            </Text>
            <View style={tabactive == 'databox' && styles.activetab} />
          </TouchableOpacity>
        </View>
        {tabactive == 'translate' ? (
          <List
            _engine={_engine}
            session_code={route.params.sessiondata?.session_code}
            isJoined={isJoined}
            langtit={sessiondata.ses_lang}
            lang={lang}
            apptoken={apptoken}
            setStartedChannelId={setStartedChannelId}
            setStartedToken={setStartedToken}
            stop={stop}
            setisLoading={setisLoading}
            isLoading={isLoading}
            setChannel_name={setChannel_name}
            muteAudio={muteAudio}
            isMute={isMute}
          />
        ) : null}
        {tabactive == 'databox' && <DataList data={sessiondata?.filelist} />}
      </View>
      <View style={styles.soundAnddurationbox}>
        <View>
          <Duration
            isJoined={isJoined}
            duration={duration}
            setDuration={setDuration}
          />
          <Sound volume={volume} />
        </View>
      </View>
    </SafeAreaView>
  ) : null
}
export default SessionScreen
