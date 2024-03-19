import axios from 'axios'

axios.defaults.baseURL = 'https://change-all.com'

// axios.defaults.baseURL='https://mori.dmonster.kr';
// axios.defaults.baseURL = 'https://dmonster1621.cafe24.com';
// axios.defaults.headers.post['Content-Type'] =
//   'application/x-www-form-urlencoded'

const post = (url, data) => {
  return new Promise((resolve, reject) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
    axios
      .post(url, data,config)
      .then(res => {
        resolve(res.data)
      })
      .catch(err => {
        reject(err)
        console.log(err)
      })
  })
};

export default post
