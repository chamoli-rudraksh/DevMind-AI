import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY is missing in environment variables");
}
const ai = new GoogleGenAI({ apiKey });

export const generateChatResponseStream = async (
  history,
  newMessage,
  repoName
) => {
  try {
    const model = 'gemini-3-flash-preview';

    const systemInstruction = `You are DevMind AI, an expert code analysis assistant.
The user is currently analyzing the repository: "${repoName}".
Assume you have full context of this codebase.
It is likely a popular library or a standard project structure.
Answer questions technically, precisely, and helpfully.
Use Markdown for code blocks.
Be concise but thorough.
Do not mention that you cannot actually see the files; simulate the analysis based on general knowledge of such projects or standard patterns.`;

    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction,
      },
      history,
    });

    const result = await chat.sendMessageStream({
      message: newMessage,
    });

    return result;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

export const generateDocContent = async (filename, repoName) => {
  try {
    const model = 'gemini-3-flash-preview';

    const prompt =`ELITE GITHUB MARKDOWN GENERATOR

You are a Documentation Architect creating visually stunning GitHub READMEs.

TASK: Generate a COMPLETE ${filename} for ${repoName} that looks like a premium landing page. Return ONLY raw Markdown.

MANDATORY VISUALS

Animations & Headers:

Use a capsule wave or gradient header from capsule-render.vercel.app with type=waving, gradient color, height 300, and text set to ${repoName}

Use typing animation from readme-typing-svg.demolab.com with dynamic text

Add custom SVG dividers between major sections

Badges & Icons (minimum 15):

Use shields.io badges for version, build, license, coverage, stars, forks, downloads, pull requests, issues

Use skill icons from skillicons.dev for js, ts, react, node, docker

Use for-the-badge style for CTA buttons

Mix badge layouts, do not place everything in a single horizontal row

Media (CRITICAL):

Include a demo GIF or screenshot with borders or styling

Include GitHub stats using github-readme-stats.vercel.app

Include an activity graph or contribution snake if applicable

Include before and after comparisons using tables

Layout:

Use a center-aligned hero section using div align="center"

Use feature grids built with HTML tables and icons

Use collapsible details sections for advanced content

Use a dark-mode friendly color palette with purples, blues, and greens

STRUCTURE (Use These Creative Titles)

Top Hero Section:

Center aligned

Animated wave header

Typing SVG animation

At least 15 badges

CTA buttons for Demo, Docs, and Discord

Divider

Demo Section:

Center aligned demo GIF

Width around 800px

Divider

Section: Why This Exists

Strong project pitch

Clearly describe the problem and why this project matters

Section: Features That’ll Blow Your Mind

Feature grid with icons

Four-column layout

Each feature has icon, title, and short description

Section: Get Started in 30 Seconds

Real installation commands using npm, yarn, or pnpm

A basic usage code example with syntax highlighting

Section: See It In Action

Collapsible sections using details

One for basic usage

One for advanced patterns

One for real-world examples

Section: API Reference or Commands

Table listing parameters, types, and descriptions

Section: Built With Love Using

Tech stack shown using badges or icons in a grid

Comparison Section:

Table comparing ${repoName} with Competitor A and Competitor B

Use emojis to highlight advantages

Section: Join the Revolution

Contributing guidelines

Link to code of conduct

Section: Hall of Fame

Contributor avatars using contrib.rocks

GitHub profile stats if available

Section: License

License badge

Short license description

Footer Section:

Center aligned

Social icons for GitHub, Discord, Twitter, LinkedIn

“Made with ❤️ by Author or Team”

Back to top link

ADVANCED TECHNIQUES TO USE

Feature Grid:

Use HTML table

Each cell centered

Include an icon image, feature name, and short description

Four features per row

CTA Buttons:

Use shields.io buttons

Include Get Started and Live Demo buttons

Use for-the-badge style

Include appropriate icons and colors

Comparison Table:

Include feature comparison with emojis

Highlight speed, cost, and setup simplicity

FORBIDDEN

No placeholders such as lorem ipsum or coming soon

No generic corporate language

No broken links or fake URLs

No large walls of text without visual breaks

SUCCESS CRITERIA

Must render perfectly on GitHub

Must feel like a Vercel, Stripe, or Linear product page

Must have immediate wow factor

All code must be copy-paste ready

Every section must contain real, useful content

Must follow modern SaaS design with generous whitespace

FINAL INSTRUCTION
Generate the full ${filename} for ${repoName}.
Push GitHub Markdown to its absolute limits.
Make it unforgettable.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: 2048,
      },
    });

    return response.text;
  } catch (error) {
    console.error('Gemini Doc Gen Error:', error);
    return '# Error Generating Documentation\n\nPlease try again.';
  }
};
