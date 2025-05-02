const ENV = process.env.NODE_ENV;

const config = {
  development: {
    frontEndURL: "http://localhost:8080/api/v1",
    backEndURL: "http://localhost:3030/api/v1",
  },
  production: {
    frontEndURL: "https://goodcall-front-end.onrender.com/api/v1",
    backEndURL: "https://goodcall-back-end.onrender.com/api/v1",
    goodCallBackEndURL: "https://goodcall.fi/api/v1",
  }
};

const urls = ENV === 'production' ? config.production : config.development;

export default urls;
