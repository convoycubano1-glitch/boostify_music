import { Router, Request, Response } from 'express';

const router = Router();

// Mock 20 courses - instant response
const mockCourses = [
  {
    id: 'course-001',
    title: 'Music Production Fundamentals',
    description: 'Learn the basics of music production from scratch',
    level: 'Beginner',
    price: '0.00',
    estimatedHours: 12,
    objectives: ['Understand DAW basics', 'Learn recording techniques', 'Master mixing fundamentals'],
    topics: ['DAW Setup', 'Recording', 'Mixing', 'Mastering'],
    skills: ['Audio Engineering', 'Music Production', 'Sound Design'],
    prerequisites: ['Basic computer skills'],
    preview: [
      { title: 'Welcome to Music Production', description: 'Introduction to the course', duration: '15 min' },
      { title: 'Setting Up Your DAW', description: 'Get your digital audio workstation ready', duration: '20 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23FF6B35" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3EMusic Production%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-002',
    title: 'Mixing and Mastering Essentials',
    description: 'Master the art of mixing and mastering professional audio',
    level: 'Intermediate',
    price: '29.99',
    estimatedHours: 15,
    objectives: ['Professional mixing techniques', 'Mastering for distribution', 'Audio quality optimization'],
    topics: ['EQ', 'Compression', 'Reverb', 'Stereo Imaging', 'Mastering'],
    skills: ['Mix Engineering', 'Audio Production', 'Quality Control'],
    prerequisites: ['Basic music production knowledge'],
    preview: [
      { title: 'Mixing Principles', description: 'Learn the core principles of mixing', duration: '25 min' },
      { title: 'Mastering Basics', description: 'Introduction to mastering', duration: '20 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%234ECDC4" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3EMixing & Mastering%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-003',
    title: 'Advanced Vocal Techniques',
    description: 'Perfect your vocal performance and recording skills',
    level: 'Advanced',
    price: '39.99',
    estimatedHours: 18,
    objectives: ['Advanced vocal techniques', 'Emotional delivery', 'Professional recording'],
    topics: ['Breathing', 'Pitch Control', 'Vibrato', 'Layering', 'Effects'],
    skills: ['Vocal Performance', 'Recording', 'Vocal Production'],
    prerequisites: ['Basic vocal training'],
    preview: [
      { title: 'Vocal Techniques', description: 'Advanced vocal methods', duration: '30 min' },
      { title: 'Recording Vocals', description: 'Professional vocal recording', duration: '25 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23F7B731" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3EVocal Techniques%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-004',
    title: 'Guitar Playing Mastery',
    description: 'From beginner to advanced guitar playing techniques',
    level: 'Beginner',
    price: '0.00',
    estimatedHours: 20,
    objectives: ['Guitar fundamentals', 'Chord mastery', 'Improvisation'],
    topics: ['Chords', 'Scales', 'Techniques', 'Theory', 'Improvisation'],
    skills: ['Guitar Performance', 'Music Theory', 'Improvisation'],
    prerequisites: ['None'],
    preview: [
      { title: 'Getting Started', description: 'Introduction to guitar', duration: '20 min' },
      { title: 'Basic Chords', description: 'Learn your first chords', duration: '25 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%235F27CD" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3EGuitar Mastery%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-005',
    title: 'Digital Audio Workstations (DAWs)',
    description: 'Complete guide to modern DAWs for music production',
    level: 'Intermediate',
    price: '24.99',
    estimatedHours: 14,
    objectives: ['DAW proficiency', 'Workflow optimization', 'Automation'],
    topics: ['DAW Features', 'MIDI', 'Audio Tracks', 'Automation', 'Plugins'],
    skills: ['DAW Mastery', 'Music Production', 'Sound Design'],
    prerequisites: ['Basic computer knowledge'],
    preview: [
      { title: 'DAW Overview', description: 'Explore different DAWs', duration: '20 min' },
      { title: 'Basic Navigation', description: 'Learn the interface', duration: '25 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%2300B894" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3EDAW Mastery%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-006',
    title: 'Music Theory for Composers',
    description: 'Essential music theory for composing original music',
    level: 'Beginner',
    price: '0.00',
    estimatedHours: 16,
    objectives: ['Music theory fundamentals', 'Composition basics', 'Harmonic analysis'],
    topics: ['Scales', 'Chords', 'Progressions', 'Composition', 'Analysis'],
    skills: ['Music Theory', 'Composition', 'Analysis'],
    prerequisites: ['None'],
    preview: [
      { title: 'Music Basics', description: 'Introduction to theory', duration: '20 min' },
      { title: 'Scales and Chords', description: 'Learn scales and chords', duration: '25 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23FF6B9D" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3EMusic Theory%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-007',
    title: 'Electronic Music Production',
    description: 'Create compelling electronic music from start to finish',
    level: 'Intermediate',
    price: '34.99',
    estimatedHours: 17,
    objectives: ['Synth basics', 'Sound design', 'Electronic arrangement'],
    topics: ['Synthesis', 'Sound Design', 'Arrangement', 'Effects', 'Distribution'],
    skills: ['Electronic Production', 'Sound Design', 'Arrangement'],
    prerequisites: ['Basic music production'],
    preview: [
      { title: 'Synth Basics', description: 'Introduction to synthesis', duration: '25 min' },
      { title: 'Sound Design', description: 'Create unique sounds', duration: '30 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%2300D2D3" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3EElectronic Music%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-008',
    title: 'Sound Design Techniques',
    description: 'Master professional sound design for any genre',
    level: 'Advanced',
    price: '44.99',
    estimatedHours: 19,
    objectives: ['Advanced sound design', 'Sonic branding', 'Effect creation'],
    topics: ['Synthesis', 'Sampling', 'Effects', 'Automation', 'Layering'],
    skills: ['Sound Design', 'Music Production', 'Audio Engineering'],
    prerequisites: ['Intermediate music production'],
    preview: [
      { title: 'Sound Design Basics', description: 'Fundamental techniques', duration: '25 min' },
      { title: 'Advanced Effects', description: 'Create unique sounds', duration: '30 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%236C5CE7" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3ESound Design%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-009',
    title: 'Music Business and Marketing',
    description: 'Build a successful music career with smart business strategies',
    level: 'Beginner',
    price: '19.99',
    estimatedHours: 10,
    objectives: ['Music industry knowledge', 'Marketing strategies', 'Revenue streams'],
    topics: ['Business Models', 'Marketing', 'Branding', 'Monetization', 'Contracts'],
    skills: ['Music Business', 'Marketing', 'Strategy'],
    prerequisites: ['None'],
    preview: [
      { title: 'Music Industry 101', description: 'How the industry works', duration: '20 min' },
      { title: 'Marketing Your Music', description: 'Effective strategies', duration: '25 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23A29BFE" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3EMusic Business%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-010',
    title: 'Live Performance Skills',
    description: 'Perform confidently on stage and engage your audience',
    level: 'Intermediate',
    price: '29.99',
    estimatedHours: 12,
    objectives: ['Stage presence', 'Performance techniques', 'Audience connection'],
    topics: ['Performance', 'Stage Presence', 'Sound Check', 'Engagement', 'Troubleshooting'],
    skills: ['Live Performance', 'Stage Presence', 'Audience Engagement'],
    prerequisites: ['Basic music skills'],
    preview: [
      { title: 'Stage Presence', description: 'Develop confidence', duration: '20 min' },
      { title: 'Performance Techniques', description: 'Techniques for live', duration: '25 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23FF7675" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3ELive Performance%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-011',
    title: 'Podcast Production',
    description: 'Create professional podcasts from concept to distribution',
    level: 'Beginner',
    price: '0.00',
    estimatedHours: 11,
    objectives: ['Podcast setup', 'Recording techniques', 'Distribution strategies'],
    topics: ['Equipment', 'Recording', 'Editing', 'Distribution', 'Promotion'],
    skills: ['Podcast Production', 'Audio Engineering', 'Content Creation'],
    prerequisites: ['None'],
    preview: [
      { title: 'Getting Started', description: 'Setup your podcast', duration: '20 min' },
      { title: 'Recording Audio', description: 'Record quality episodes', duration: '25 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23FDCB6E" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3EPodcast Production%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-012',
    title: 'Hip-Hop Production',
    description: 'Learn to produce authentic hip-hop beats and tracks',
    level: 'Intermediate',
    price: '34.99',
    estimatedHours: 16,
    objectives: ['Hip-hop rhythm', 'Beat production', 'Sample usage'],
    topics: ['Rhythm', 'Sampling', 'Production', 'Arrangement', 'Mixing'],
    skills: ['Hip-Hop Production', 'Beat Making', 'Sampling'],
    prerequisites: ['Basic music production'],
    preview: [
      { title: 'Hip-Hop Basics', description: 'History and fundamentals', duration: '20 min' },
      { title: 'Beat Production', description: 'Create hip-hop beats', duration: '30 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%232C3E50" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3EHip-Hop Production%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-013',
    title: 'Jazz Improvisation',
    description: 'Master jazz improvisation and soloing techniques',
    level: 'Advanced',
    price: '39.99',
    estimatedHours: 18,
    objectives: ['Jazz theory', 'Improvisation', 'Solo techniques'],
    topics: ['Jazz Chords', 'Scales', 'Improvisation', 'Comping', 'Standards'],
    skills: ['Jazz Improvisation', 'Music Theory', 'Performance'],
    prerequisites: ['Music theory basics'],
    preview: [
      { title: 'Jazz Theory', description: 'Jazz chord progressions', duration: '25 min' },
      { title: 'Improvisation', description: 'Learn to improvise', duration: '30 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%238B4513" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3EJazz Improvisation%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-014',
    title: 'Film Scoring and Soundtracks',
    description: 'Compose compelling scores for visual media',
    level: 'Intermediate',
    price: '39.99',
    estimatedHours: 15,
    objectives: ['Film scoring basics', 'Orchestration', 'Timing and synchronization'],
    topics: ['Composition', 'Orchestration', 'Timing', 'Emotion', 'Technology'],
    skills: ['Film Scoring', 'Composition', 'Orchestration'],
    prerequisites: ['Music theory knowledge'],
    preview: [
      { title: 'Scoring Basics', description: 'Introduction to film scoring', duration: '25 min' },
      { title: 'Orchestration', description: 'Arrange for orchestras', duration: '30 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23228B22" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3EFilm Scoring%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-015',
    title: 'Songwriting Craft',
    description: 'Write hit songs with professional songwriting techniques',
    level: 'Beginner',
    price: '24.99',
    estimatedHours: 13,
    objectives: ['Songwriting basics', 'Lyric writing', 'Song structure'],
    topics: ['Structure', 'Lyrics', 'Melody', 'Harmony', 'Arrangement'],
    skills: ['Songwriting', 'Lyric Writing', 'Composition'],
    prerequisites: ['None'],
    preview: [
      { title: 'Song Structure', description: 'Learn song formats', duration: '20 min' },
      { title: 'Lyric Writing', description: 'Write meaningful lyrics', duration: '25 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23DC143C" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3ESongwriting%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-016',
    title: 'Studio Recording Techniques',
    description: 'Record professional quality audio in any studio environment',
    level: 'Intermediate',
    price: '29.99',
    estimatedHours: 14,
    objectives: ['Recording setup', 'Microphone techniques', 'Quality capture'],
    topics: ['Microphones', 'Preamps', 'Techniques', 'Troubleshooting', 'Optimization'],
    skills: ['Recording', 'Audio Engineering', 'Studio Skills'],
    prerequisites: ['Basic audio knowledge'],
    preview: [
      { title: 'Studio Setup', description: 'Prepare your studio', duration: '20 min' },
      { title: 'Recording Vocals', description: 'Capture great vocals', duration: '25 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23FF4500" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3EStudio Recording%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-017',
    title: 'Music Video Production',
    description: 'Create compelling music videos from concept to final edit',
    level: 'Beginner',
    price: '0.00',
    estimatedHours: 12,
    objectives: ['Video production basics', 'Concept development', 'Editing'],
    topics: ['Planning', 'Filming', 'Editing', 'Effects', 'Distribution'],
    skills: ['Video Production', 'Editing', 'Cinematography'],
    prerequisites: ['None'],
    preview: [
      { title: 'Video Basics', description: 'Introduction to video', duration: '20 min' },
      { title: 'Planning Shoot', description: 'Pre-production guide', duration: '25 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23FF1493" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3EMusic Video%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-018',
    title: 'Music Licensing and Rights',
    description: 'Navigate music licensing and protect your intellectual property',
    level: 'Intermediate',
    price: '24.99',
    estimatedHours: 10,
    objectives: ['Licensing basics', 'Rights protection', 'Revenue optimization'],
    topics: ['Licensing Types', 'Contracts', 'Copyright', 'Registration', 'Revenue'],
    skills: ['Music Law', 'Business Strategy', 'Rights Management'],
    prerequisites: ['None'],
    preview: [
      { title: 'Licensing 101', description: 'Types of licenses', duration: '20 min' },
      { title: 'Protecting Rights', description: 'Protect your music', duration: '20 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%236A0572" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3ELicensing & Rights%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-019',
    title: 'Music Promotion Strategies',
    description: 'Market your music effectively across all platforms',
    level: 'Beginner',
    price: '19.99',
    estimatedHours: 11,
    objectives: ['Social media strategy', 'Audience building', 'Promotion tactics'],
    topics: ['Social Media', 'Advertising', 'Networking', 'Analytics', 'Growth'],
    skills: ['Marketing', 'Social Media', 'Audience Building'],
    prerequisites: ['None'],
    preview: [
      { title: 'Promotion Basics', description: 'Marketing fundamentals', duration: '20 min' },
      { title: 'Social Media Strategy', description: 'Build your presence', duration: '25 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%2300CED1" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3EMusic Promotion%3C/text%3E%3C/svg%3E',
    isPublished: true
  },
  {
    id: 'course-020',
    title: 'Orchestra Arrangement',
    description: 'Arrange music for full orchestras with professional techniques',
    level: 'Advanced',
    price: '49.99',
    estimatedHours: 20,
    objectives: ['Orchestral arrangement', 'Instrumentation', 'Professional scoring'],
    topics: ['Instrumentation', 'Voicing', 'Balance', 'Techniques', 'Technology'],
    skills: ['Orchestration', 'Arrangement', 'Composition'],
    prerequisites: ['Advanced music theory'],
    preview: [
      { title: 'Orchestra Basics', description: 'Learn orchestral instruments', duration: '25 min' },
      { title: 'Arrangement Techniques', description: 'Professional methods', duration: '30 min' }
    ],
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%234B0082" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-weight="bold"%3EOrchestra Arrangement%3C/text%3E%3C/svg%3E',
    isPublished: true
  }
];

// Return mock courses instantly
router.post('/api/education/get-courses', (req: Request, res: Response) => {
  console.log('📚 Serving 20 mock courses');
  res.json({
    success: true,
    count: mockCourses.length,
    courses: mockCourses
  });
});

export default router;
