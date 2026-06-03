export interface BlogPost {
  id: string
  title: string
  date: string
  summary: string
  content: string
  tags: string[]
}

export const blogPosts: BlogPost[] = [
  {
    id: "welcome",
    title: "Welcome to My Website",
    date: "2026-06-03",
    summary: "Hello! This is my personal website built with React, Vite, and shadcn/ui.",
    content: `# Welcome to My Website

Hello! I'm **WingChunWong**, a student from Hong Kong. This is my personal website where I share my projects, thoughts, and tools.

## What You'll Find Here

- **Blog** - My thoughts and experiences
- **Tools** - Fun interactive games and utilities
- **Projects** - Links to my GitHub repositories

## Tech Stack

This website is built with:

- **React 19** - UI library
- **Vite 8** - Build tool
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Component library
- **TypeScript** - Type safety

Feel free to explore around!`,
    tags: ["introduction", "website"],
  },
  {
    id: "vibe-coding",
    title: "My Experience with Vibe Coding",
    date: "2026-06-01",
    summary: "Sharing my thoughts on the 'vibe coding' approach to building software.",
    content: `# My Experience with Vibe Coding

Vibe coding has been a game-changer for me. Instead of spending hours reading documentation, I just describe what I want and let AI help me build it.

## What is Vibe Coding?

The term was coined by Andrej Karpathy. It's about:

1. Describing what you want in natural language
2. Letting AI generate the code
3. Iterating quickly based on results

## My Workflow

\`\`\`
1. Describe the feature
2. Review the generated code
3. Test and iterate
4. Polish and deploy
\`\`\`

## Results

I've been able to build this website and several other projects much faster than traditional coding. It's especially great for:

- Prototyping ideas quickly
- Learning new frameworks
- Building UI components

The key is to still understand the code, even if you're not writing every line from scratch.`,
    tags: ["coding", "ai", "productivity"],
  },
  {
    id: "hong-kong-tech",
    title: "Tech Scene in Hong Kong",
    date: "2026-05-28",
    summary: "A brief overview of the growing tech ecosystem in Hong Kong.",
    content: `# Tech Scene in Hong Kong

Hong Kong has a growing tech ecosystem that's exciting to be part of.

## Key Areas

- **Fintech** - Hong Kong is a global financial center
- **Smart City** - Government initiatives for digital transformation
- **Startups** - Growing number of tech startups and incubators

## Communities

There are many tech meetups and communities:

- HKJS - Hong Kong JavaScript community
- Various hackathons and coding events
- University tech clubs

## Future

The future looks bright for tech in Hong Kong, with more investment in innovation and digital infrastructure.`,
    tags: ["hong-kong", "tech", "community"],
  },
]
