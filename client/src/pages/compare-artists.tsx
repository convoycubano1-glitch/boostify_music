import { useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";

export default function CompareArtistsPage() {
  const [slug1, setSlug1] = useState("redwine2");
  const [slug2, setSlug2] = useState("reychavezsolofranck");
  const [data1, setData1] = useState<any>(null);
  const [data2, setData2] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchArtist = async (slug: string) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("slug", "==", slug));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    return null;
  };

  const compare = async () => {
    setLoading(true);
    try {
      const [artist1, artist2] = await Promise.all([
        fetchArtist(slug1),
        fetchArtist(slug2)
      ]);
      setData1(artist1);
      setData2(artist2);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDataSize = (obj: any) => {
    return JSON.stringify(obj || {}).length;
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-orange-500">Comparar Artistas</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Input
            value={slug1}
            onChange={(e) => setSlug1(e.target.value)}
            placeholder="Slug 1"
            className="bg-gray-900 text-white"
          />
          <Input
            value={slug2}
            onChange={(e) => setSlug2(e.target.value)}
            placeholder="Slug 2"
            className="bg-gray-900 text-white"
          />
        </div>

        <Button
          onClick={compare}
          disabled={loading}
          className="mb-6 bg-orange-500 hover:bg-orange-600"
        >
          {loading ? "Comparando..." : "Comparar"}
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Artist 1 */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-orange-500">{slug1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data1 ? (
                <>
                  <div className="text-sm">
                    <strong>Tamaño de datos:</strong> {getDataSize(data1)} bytes
                  </div>
                  <div className="text-sm">
                    <strong>Nombre:</strong> {data1.displayName || data1.name}
                  </div>
                  <div className="text-sm">
                    <strong>UID:</strong> {data1.uid}
                  </div>
                  <div className="text-sm">
                    <strong>Biografía:</strong> {data1.biography?.length || 0} caracteres
                  </div>
                  <div className="text-sm">
                    <strong>Banner Image:</strong> {data1.bannerImage ? "Sí" : "No"}
                  </div>
                  <div className="text-sm">
                    <strong>Profile Image:</strong> {data1.profileImage ? "Sí" : "No"}
                  </div>
                  <div className="text-sm">
                    <strong>PhotoURL:</strong> {data1.photoURL ? "Sí" : "No"}
                  </div>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-orange-500 mb-2">Ver JSON completo</summary>
                    <pre className="bg-black p-2 rounded overflow-auto max-h-96">
                      {JSON.stringify(data1, null, 2)}
                    </pre>
                  </details>
                </>
              ) : (
                <p className="text-gray-400">No hay datos</p>
              )}
            </CardContent>
          </Card>

          {/* Artist 2 */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-orange-500">{slug2}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data2 ? (
                <>
                  <div className="text-sm">
                    <strong>Tamaño de datos:</strong> {getDataSize(data2)} bytes
                  </div>
                  <div className="text-sm">
                    <strong>Nombre:</strong> {data2.displayName || data2.name}
                  </div>
                  <div className="text-sm">
                    <strong>UID:</strong> {data2.uid}
                  </div>
                  <div className="text-sm">
                    <strong>Biografía:</strong> {data2.biography?.length || 0} caracteres
                  </div>
                  <div className="text-sm">
                    <strong>Banner Image:</strong> {data2.bannerImage ? "Sí" : "No"}
                  </div>
                  <div className="text-sm">
                    <strong>Profile Image:</strong> {data2.profileImage ? "Sí" : "No"}
                  </div>
                  <div className="text-sm">
                    <strong>PhotoURL:</strong> {data2.photoURL ? "Sí" : "No"}
                  </div>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-orange-500 mb-2">Ver JSON completo</summary>
                    <pre className="bg-black p-2 rounded overflow-auto max-h-96">
                      {JSON.stringify(data2, null, 2)}
                    </pre>
                  </details>
                </>
              ) : (
                <p className="text-gray-400">No hay datos</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Diferencias */}
        {data1 && data2 && (
          <Card className="bg-gray-900 border-gray-800 mt-6">
            <CardHeader>
              <CardTitle className="text-orange-500">Diferencias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Diferencia de tamaño:</strong>{" "}
                  {Math.abs(getDataSize(data1) - getDataSize(data2))} bytes
                </div>
                <div>
                  <strong>Campos únicos en {slug1}:</strong>{" "}
                  {Object.keys(data1).filter(k => !(k in data2)).join(", ") || "Ninguno"}
                </div>
                <div>
                  <strong>Campos únicos en {slug2}:</strong>{" "}
                  {Object.keys(data2).filter(k => !(k in data1)).join(", ") || "Ninguno"}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
