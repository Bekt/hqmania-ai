exports.sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};


exports.log = (...args) => {
    console.log(...args);
};
