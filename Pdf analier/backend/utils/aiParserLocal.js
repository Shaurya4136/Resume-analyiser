import axios from "axios";

export const parseWithLocalAI = async (text) => {
  try {
    const prompt = `
Extract:
- Full Name
- Email
- Phone
- Location
- Last Company

Return JSON only.

Resume:
${text.slice(0, 3000)}
`;

    const res = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3",
      prompt,
      stream: false
    });

    return JSON.parse(res.data.response);

  } catch (err) {
    console.log("AI error:", err.message);
    return {};
  }
};