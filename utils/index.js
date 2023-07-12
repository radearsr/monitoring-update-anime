const slugs = require("slugs");

const currentTime = () => {
  const date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  hours = hours < 10 ? `0${hours}` : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  const strTime = `${hours}:${minutes}:${seconds}`;
  return `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()} ${strTime}`;
};

const compareAndListed = (oldLists, newLists) => {
  // console.log(oldLists);
  // console.log(newLists);
  const resultLists = [];
  newLists.forEach((list) => {
    const newSlug = slugs(list.title);
    const filteredList = oldLists.filter((oldList) => {
      if (oldList.slug.includes(newSlug)) {
        return oldList;
      }
    });
    if (filteredList.length < 1) {
      resultLists.push(list);
    }
  });
  return resultLists;
};

module.exports = {
  currentTime,
  compareAndListed,
};