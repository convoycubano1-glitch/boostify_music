import { SimpleTryOnComponent } from "@/components/kling/simple-tryon";

export default function TryOnPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Prueba Virtual de Ropa</h1>
      <p className="text-center mb-8 text-gray-600 max-w-2xl mx-auto">
        Sube una imagen de una persona (modelo) y una prenda de ropa para ver cómo se vería la prenda en el modelo usando inteligencia artificial.
      </p>

      <div className="max-w-xl mx-auto">
        <SimpleTryOnComponent />
      </div>

      <div className="mt-10 max-w-2xl mx-auto bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Instrucciones</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>La imagen del modelo debe mostrar claramente a la persona de frente o en un ángulo ligeramente inclinado.</li>
          <li>La prenda debe ser claramente visible y preferiblemente sobre fondo blanco o neutro.</li>
          <li>Las imágenes deben estar en formato JPG o PNG para mejores resultados.</li>
          <li>El proceso puede tardar entre 10-20 segundos dependiendo del tamaño de las imágenes.</li>
        </ul>
      </div>
    </div>
  );
}