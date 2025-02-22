import { db } from "./firebase-admin";

async function seedCourse() {
  const courseData = {
    title: "Music Industry Professional: Complete Artist Development Program",
    description: "A comprehensive course designed to transform aspiring musicians into industry professionals. Learn everything from music production to business management, marketing, and career development.",
    createdBy: "system",
    createdAt: new Date(),
    content: {
      curriculum: [
        {
          title: "Understanding the Modern Music Industry",
          description: "Overview of today's music industry landscape, key players, and revenue streams",
          estimatedMinutes: 45
        },
        {
          title: "Building Your Artist Identity",
          description: "Developing your unique brand, visual aesthetics, and artistic vision",
          estimatedMinutes: 60
        },
        {
          title: "Music Production Fundamentals",
          description: "Essential knowledge about recording, mixing, and mastering your music",
          estimatedMinutes: 90
        },
        {
          title: "Digital Distribution Strategies",
          description: "Understanding streaming platforms, distribution services, and release strategies",
          estimatedMinutes: 60
        },
        {
          title: "Social Media Marketing for Musicians",
          description: "Creating engaging content and building a strong social media presence",
          estimatedMinutes: 75
        },
        {
          title: "Music Copyright and Royalties",
          description: "Understanding music rights, licensing, and revenue collection",
          estimatedMinutes: 90
        },
        {
          title: "Building Your Team",
          description: "Working with managers, agents, lawyers, and other industry professionals",
          estimatedMinutes: 60
        },
        {
          title: "Concert and Tour Planning",
          description: "Planning and executing successful live performances and tours",
          estimatedMinutes: 90
        },
        {
          title: "Fan Engagement Strategies",
          description: "Building and maintaining a loyal fan base through various channels",
          estimatedMinutes: 60
        },
        {
          title: "Music Video Production",
          description: "Creating professional music videos and visual content",
          estimatedMinutes: 75
        },
        {
          title: "Streaming Platform Optimization",
          description: "Maximizing your presence on Spotify, Apple Music, and other platforms",
          estimatedMinutes: 60
        },
        {
          title: "Professional Networking",
          description: "Building industry relationships and networking effectively",
          estimatedMinutes: 45
        },
        {
          title: "Revenue Diversification",
          description: "Exploring multiple income streams in the music industry",
          estimatedMinutes: 90
        },
        {
          title: "Music Publishing",
          description: "Understanding and maximizing publishing rights and opportunities",
          estimatedMinutes: 75
        },
        {
          title: "Digital Marketing Campaigns",
          description: "Planning and executing successful marketing campaigns",
          estimatedMinutes: 90
        },
        {
          title: "Brand Partnerships",
          description: "Securing and managing brand collaborations and sponsorships",
          estimatedMinutes: 60
        },
        {
          title: "Music Press and PR",
          description: "Working with media outlets and managing public relations",
          estimatedMinutes: 75
        },
        {
          title: "Concert Production",
          description: "Technical aspects of live performance and stage production",
          estimatedMinutes: 90
        },
        {
          title: "Music Business Finance",
          description: "Managing finances, budgeting, and investment in your career",
          estimatedMinutes: 90
        },
        {
          title: "International Market Entry",
          description: "Strategies for expanding into international markets",
          estimatedMinutes: 75
        },
        {
          title: "Music Merchandise",
          description: "Creating and selling merchandise effectively",
          estimatedMinutes: 60
        },
        {
          title: "Radio Promotion",
          description: "Getting your music played on radio and promotional strategies",
          estimatedMinutes: 75
        },
        {
          title: "Artist Website Development",
          description: "Creating and maintaining a professional artist website",
          estimatedMinutes: 60
        },
        {
          title: "Career Sustainability",
          description: "Long-term career planning and sustainable success strategies",
          estimatedMinutes: 90
        }
      ]
    }
  };

  try {
    await db.collection('courses').add(courseData);
    console.log('Course seeded successfully');
  } catch (error) {
    console.error('Error seeding course:', error);
  }
}

seedCourse();
