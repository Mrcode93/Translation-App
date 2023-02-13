"use strict";

const textField = document.getElementById("input-text");
const resultField = document.querySelector("#output-section");
const resultFieldText = document.querySelector("#output-text");
const loader = document.querySelector(".loading");
const submitButton = document.querySelector("#submit");

//! get the language of text field.
textField.addEventListener("input", (e) => {
  e.preventDefault();
  const textFieldValue = textField.value.trim();

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": "745e563a14msh1097188a84d9738p14199bjsn34e362db911d",
      "X-RapidAPI-Host": "community-language-detection.p.rapidapi.com",
    },
    // body: JSON.stringify({ language: textFieldValue }),
    body: `{"q":"${textFieldValue}"}`,
  };

  fetch("https://community-language-detection.p.rapidapi.com/detect", options)
    .then((response) => response.json())
    .then((response) => {
      let language = response.data.detections[0].language;
      getData(language);
    })
    .catch((err) => console.error(err));
});

function getData(language) {
  const textFieldValue = textField.value;
  console.log(language);

  if (!textFieldValue) {
    resultField.classList.remove("show");
    return;
  }
  let from;
  let to;
  if (language === "en") {
    from = "en";
    to = "ar";
    textField.style.direction = "ltr";
    resultFieldText.style.direction = "rtl";
  } else if (language === "ar") {
    from = "ar";
    to = "en";
    textField.style.direction = "rtl";
    resultFieldText.style.direction = "ltr";
  }

  fetchApi(from, to, textFieldValue);
}

//! function when presse enter translate text
document.getElementById("form").addEventListener("keydown", handleKeyDown);
submitButton.addEventListener("click", handleClick);

function handleKeyDown(event) {
  if (event.keyCode === 13) {
    getData();
  }
}

function handleClick() {
  getData();
}

function fetchApi(from, to, text) {
  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": "745e563a14msh1097188a84d9738p14199bjsn34e362db911d",
      "X-RapidAPI-Host": "nlp-translation.p.rapidapi.com",
    },
  };

  loader.classList.add("active");

  fetch(
    `https://nlp-translation.p.rapidapi.com/v1/translate?text=${text}&to=${to}&from=${from}`,
    options
  )
    .then((response) => response.json())
    .then((response) => {
      //remove loading
      loader.classList.remove("active");
      // show translated field
      resultField.classList.add("show");
      const output = response.translated_text;
      // the result of the translation
      const result = output[to];
      resultFieldText.innerText = result;
      //! make the direction of the result field
      resultFieldText.style.direction = from === "ar" ? "ltr" : "rtl";
      saveData(text, result, from, to);
    })
    .catch((err) => {
      // console.error(err);
      loader.classList.remove("active");
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
      });
    });
}
// }

//! copy the text to the clipboard
document.querySelector("ion-icon").addEventListener("click", function () {
  const outputText = document.getElementById("output-text").innerText;
  const tempInput = document.createElement("input");
  tempInput.style = "position: absolute; left: -1000px; top: -1000px";
  tempInput.value = outputText;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);

  const popup = document.createElement("div");
  popup.classList.add("popup");
  popup.innerText = "Copied to clipboard!";

  resultField.appendChild(popup);

  setTimeout(function () {
    popup.style.display = "none";
  }, 2000);
});
//! save the old translation to local storage
const oldTranslation = document.querySelector(".history");

function saveData(text, result, from, to) {
  let translations = [];
  // Check if any data exists in local storage
  if (localStorage.getItem("translations")) {
    translations = JSON.parse(localStorage.getItem("translations"));
  }
  // Add new translation data
  translations.push({
    text: text,
    translation: result,
    original: from,
    another: to,
  });
  localStorage.setItem("translations", JSON.stringify(translations));
}
// ! get data from local storage and display in divs
const displayData = () => {
  let translationHistory =
    JSON.parse(localStorage.getItem("translations")) || [];
  let historyContainer = document.querySelector(".history");
  let historyDivs = [];

  if (translationHistory.length <= 0) {
    oldTranslation.classList.remove("display");
  } else {
    oldTranslation.classList.add("display");
  }

  translationHistory.reverse();
  translationHistory.forEach((data, index) => {
    //! check if translation text from which language
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": "745e563a14msh1097188a84d9738p14199bjsn34e362db911d",
        "X-RapidAPI-Host": "community-language-detection.p.rapidapi.com",
      },
      // body: JSON.stringify({ language: textFieldValue }),
      body: `{"q":"${data.translation.trim()}"}`,
    };

    fetch("https://community-language-detection.p.rapidapi.com/detect", options)
      .then((response) => response.json())
      .then((response) => {
        let language = response.data.detections[0].language;

        if (language === "en") {
          let historyDiv = document.createElement("div");

          historyDiv.id = `item-${index}`;
          historyDiv.classList.add("item");
          historyDiv.innerHTML = `
          <p id='original'>${data.text}</p>
          <p id='translations' dir="ltr">${data.translation}</p>
          <ion-icon id='delete-${index}' class='delete' name="trash-outline"></ion-icon>
        `;
          historyContainer.appendChild(historyDiv);
          historyDivs.push(historyDiv);
        } else {
          let historyDiv = document.createElement("div");

          historyDiv.id = `item-${index}`;
          historyDiv.classList.add("item");
          historyDiv.innerHTML = `
          <p id='original'>${data.text}</p>
          <p id='translations' dir="rtl">${data.translation}</p>
          <ion-icon id='delete-${index}' class='delete' name="trash-outline"></ion-icon>
        `;
          historyContainer.appendChild(historyDiv);
          historyDivs.push(historyDiv);
        }
      })
      .catch((err) => console.error(err));
    //!====================================================
  });
  //! delete history item
  historyContainer.addEventListener("click", function (event) {
    if (event.target.id.startsWith("delete-")) {
      let index = event.target.id.split("-")[1];
      let updatedHistory =
        JSON.parse(localStorage.getItem("translations")) || [];
      updatedHistory.splice(index, 1);
      localStorage.setItem("translations", JSON.stringify(updatedHistory));
      historyDivs[index].remove();
    }
  });
};

displayData();
