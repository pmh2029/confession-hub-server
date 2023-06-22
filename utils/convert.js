const Post = require("../models/Post");
const fetch = require("node-fetch");

const convertContent = async (content) => {
  // Replace post links
  const regexPostLink = /(^|\s)(#cfs[0-9]+)(?=\s|$)/g;
  const postLinkMatches = content.match(regexPostLink);
  if (postLinkMatches) {
    const resultArray = postLinkMatches.map((match) =>
      parseInt(match.replace("#cfs", "").trim())
    );
    const posts = await Post.find({ postNumber: { $in: resultArray } });
    const postLinks = posts.filter((post) =>
      resultArray.includes(post.postNumber)
    );
    postLinks.forEach((post) => {
      const regex = new RegExp(`#cfs${post.postNumber}\\b`, "g");
      const replacement = `[#cfs${post.postNumber}](http://${process.env.CLIENT_URL}/posts/${post._id})`;
      content = content.replace(regex, replacement);
    });
  }

  // Replace words with asterisks
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
  const startIndexEndIndexArray = nerOutputJson.result
    .filter((obj) =>
      [
        "PER",
        "PRO_Other",
        "LOC_GPE",
        "LOC_Other",
        "ORG_Corporation",
        "ORG_Other",
      ].includes(obj.type)
    )
    .map((obj) => [obj.start_index, obj.end_index]);

  for (const [startIndex, endIndex] of startIndexEndIndexArray) {
    const word = content.substring(startIndex, endIndex);
    const replacedWord = word.replace(/[^\s]/g, "⋆");
    content =
      content.slice(0, startIndex) + replacedWord + content.slice(endIndex);
  }

  const contentWithNoSpace = content.replace(/\s/g, "");
  const regexAsterisk = /^⋆+$/;
  if (regexAsterisk.test(contentWithNoSpace)) {
    throw new Error("Invalid content");
  }

  return content;
};

module.exports = convertContent;
