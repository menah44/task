console.log("NEXT_PUBLIC_API_URL =", process.env.NEXT_PUBLIC_API_URL);
console.log("Entire Env keys:", Object.keys(process.env).filter(k => k.includes("API") || k.includes("URL") || k.includes("PORT")));
