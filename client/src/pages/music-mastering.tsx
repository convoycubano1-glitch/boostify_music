import { AudioMastering } from "../components/music/audio-mastering";

export default function MusicMasteringPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Voice & Audio Tools</h1>
      <p className="text-muted-foreground mb-8">
        Transform your vocals with our professional voice models and audio processing tools.
      </p>
      
      <AudioMastering />
    </div>
  );
}