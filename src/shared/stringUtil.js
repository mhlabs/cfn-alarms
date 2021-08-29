function pluralise(word) {
  if (word.substr(-1) === "y") {
    return word.substr(0, word.length - 1) + "ies";
  } else {
    return word + "s";
  }
}

module.exports = {
  pluralise: pluralise,
};
