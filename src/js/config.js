const ENV = process.env.NODE_ENV;

const config = {
  development: {
    frontEndURL: "http://localhost:8080",
    backEndURL: "http://localhost:3030/api/v1",
  },
  production: {
    frontEndURL: "https://goodcall-front-end.onrender.com",
    backEndURL: "https://goodcall-back-end.onrender.com",
    goodCallBackEndURL: "https://goodcall.fi/api/v1",
  }
};

const urls = ENV === 'production' ? config.production : config.development;

export default urls;
