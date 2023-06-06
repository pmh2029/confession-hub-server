const replaceWordsWithAsterisk = async (content) => {
  const nerBody = { sentence: content };
  const nerOutput = await fetch("https://viettelgroup.ai/nlp/api/v1/ner", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      token: process.env.NER_API_TOKEN,
    },
    body: JSON.stringify(nerBody),
  });

  const nerOutputJson = await nerOutput.json();
  console.log(nerOutputJson);
  let startIndexEndIndexArray = nerOutputJson.result
    .filter(
      (obj) =>
        obj.type === "PER" ||
        obj.type === "PRO_Other" ||
        obj.type === "LOC_GPE" ||
        obj.type === "LOC_Other" ||
        obj.type === "ORG_Corporation" ||
        obj.type === "ORG_Other"
    )
    .map((obj) => [obj.start_index, obj.end_index]);

  for (let i = 0; i < startIndexEndIndexArray.length; i++) {
    let [startIndex, endIndex] = startIndexEndIndexArray[i];
    let word = content.substring(startIndex, endIndex);
    let replacedWord = word.replace(/[^\s]/g, "⋆");
    content =
      content.slice(0, startIndex) + replacedWord + content.slice(endIndex);
  }

  const contentWithNoSpace = content.replace(/\s/g, "");
  const regex = /^⋆+$/;
  if (regex.test(contentWithNoSpace)) {
    throw new Error("Invalid content");
  }
  return content;
};

module.exports = replaceWordsWithAsterisk;
