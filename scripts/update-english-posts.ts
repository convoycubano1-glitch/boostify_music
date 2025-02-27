import { firestoreSocialNetworkService, Post } from '../server/services/firestore-social-network.ts';
import { db } from '../server/firebase.ts';

// High-quality English content for posts about music
const englishMusicPosts = [
  "Just finished recording a new track! The mixing process took longer than expected, but the final result sounds incredible. Can't wait to share it with all of you next week.",
  
  "What studio monitors are you all using? I'm considering upgrading my current setup and would love some recommendations based on experience.",
  
  "Attended a workshop on music production techniques yesterday. Learning about parallel compression was a game-changer for my drum tracks. Anyone else use this technique?",
  
  "The transition from traditional music distribution to streaming has completely changed how we release music. As an independent artist, I find that releasing singles more frequently works better than albums.",
  
  "Been experimenting with unusual time signatures lately. 7/8 feels surprisingly natural once you get into it. What's your favorite non-4/4 song?",
  
  "Question for the songwriters here: do you start with lyrics, melody, or chord progression? I've always been a chord-first person, but trying to switch up my process.",
  
  "Just discovered this amazing VST plugin that simulates vintage analog synths perfectly. The sound is incredibly warm and authentic. I'll share the name if anyone's interested.",
  
  "Music collaboration has become so much easier with modern technology. Currently working on a track with a vocalist from Australia while I'm based in Canada. The internet is amazing!",
  
  "Thoughts on AI in music production? I've tried some AI mastering services and was surprised by the quality. I still prefer human mastering for important releases though.",
  
  "After years of producing electronic music, I've started to incorporate more live instruments into my tracks. The organic textures add so much depth and emotion.",
  
  "Social media marketing is both the best and worst part of being an independent musician today. Anyone found a good balance between promotion and actually making music?",
  
  "Just experienced a very productive creative block. Sometimes stepping away from music for a few days gives you a completely new perspective. Came back with fresh ears and finally finished that track.",
  
  "Vinyl is making such a huge comeback! Just got my latest EP pressed on beautiful blue vinyl and the demand has been amazing. Anyone else investing in physical releases?",
  
  "Does anyone else struggle with naming their tracks? I have five finished instrumentals sitting on my hard drive because I can't come up with proper titles!",
  
  "Music licensing has been a great additional revenue stream for me this year. Getting my tracks in commercials and YouTube videos has really helped support my creative work.",
  
  "The line between genres keeps getting blurrier and I love it. My latest project incorporates elements of jazz, electronic, and hip-hop. Genre fusion is the future!",
  
  "What's your approach to writer's block? I find that setting strict limitations (like using only 3 chords or writing in an unusual scale) helps me break through creative barriers.",
  
  "Studio upgrade day! Finally invested in proper acoustic treatment and the difference in my mixes is night and day. Don't underestimate room acoustics, folks.",
  
  "Anyone here use Ableton's session view for live performances? Looking for tips on creating a dynamic live electronic set that isn't just pressing play.",
  
  "The connection between visual art and music is fascinating. I've started collaborating with a visual artist for my live shows and it's elevated the whole experience tremendously."
];

// Function to update English posts with better content
async function updateEnglishPosts() {
  try {
    console.log("🔄 Starting update of English language posts...");
    
    // Get all posts
    const posts = await firestoreSocialNetworkService.getAllPosts();
    
    // Filter English posts (by checking if user's language is 'en')
    const englishPosts: Post[] = [];
    
    for (const post of posts) {
      // Get user details to check language
      const user = await firestoreSocialNetworkService.getUserById(post.userId);
      if (user && user.language === 'en') {
        englishPosts.push(post);
      }
    }
    
    console.log(`Found ${englishPosts.length} English posts to update`);
    
    // Update each English post with new music-related content
    let updatedCount = 0;
    for (let i = 0; i < englishPosts.length; i++) {
      const post = englishPosts[i];
      const musicContent = englishMusicPosts[i % englishMusicPosts.length];
      
      // Use direct Firestore update to avoid issues
      if (post.id) {
        await db.collection('social_posts').doc(post.id).update({
          content: musicContent,
          updatedAt: new Date()
        });
        updatedCount++;
        console.log(`Updated post ${post.id} with new music content`);
      }
    }
    
    console.log(`✅ Successfully updated ${updatedCount} English posts with music-related content!`);
    
  } catch (error) {
    console.error("❌ Error updating English posts:", error);
  }
}

// Run the script
updateEnglishPosts()
  .then(() => {
    console.log("Script completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script error:", error);
    process.exit(1);
  });