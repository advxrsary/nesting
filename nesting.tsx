import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const generateColor = () => {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
};

const optimizeCutting = (slabWidth, slabHeight, pieces) => {
  if (slabWidth <= 0 || slabHeight <= 0) {
    throw new Error("Размеры слэба должны быть положительными числами.");
  }
  
  let totalArea = 0;
  let placements = [];

  pieces.forEach(piece => {
    if (piece.width <= 0 || piece.height <= 0) {
      throw new Error(`Размеры детали "${piece.name}" должны быть положительными числами.`);
    }
    if (piece.width > slabWidth || piece.height > slabHeight) {
      throw new Error(`Деталь "${piece.name}" больше, чем слэб.`);
    }
    
    let piecesAcross = Math.floor(slabWidth / piece.width);
    let piecesDown = Math.floor(slabHeight / piece.height);
    let pieceCount = piecesAcross * piecesDown;
    totalArea += pieceCount * piece.width * piece.height;
    placements.push({ ...piece, count: pieceCount, across: piecesAcross, down: piecesDown });
  });

  const totalSlabArea = slabWidth * slabHeight;
  const wasteArea = totalSlabArea - totalArea;

  return { placements, wasteArea };
};

const NestingOptimizer = () => {
  const [slabWidth, setSlabWidth] = useState(1000);
  const [slabHeight, setSlabHeight] = useState(2000);
  const [pieces, setPieces] = useState([{ name: 'Деталь 1', width: 200, height: 300, color: generateColor() }]);
  const [result, setResult] = useState(null);
  const [scale, setScale] = useState(0.2);
  const [error, setError] = useState(null);

  useEffect(() => {
    handleOptimize();
  }, [slabWidth, slabHeight, pieces]);

  const handleOptimize = () => {
    try {
      setError(null);
      const { placements, wasteArea } = optimizeCutting(slabWidth, slabHeight, pieces);
      setResult({ placements, wasteArea });
      
      const maxDimension = Math.max(slabWidth, slabHeight);
      setScale(300 / maxDimension);
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  };

  const addPiece = () => {
    setPieces([...pieces, { name: `Деталь ${pieces.length + 1}`, width: 100, height: 100, color: generateColor() }]);
  };

  const removePiece = (index) => {
    setPieces(pieces.filter((_, i) => i !== index));
  };

  const updatePiece = (index, field, value) => {
    const newPieces = [...pieces];
    newPieces[index][field] = value;
    setPieces(newPieces);
  };

  const validateInput = (value, fieldName) => {
    if (value <= 0) {
      throw new Error(`${fieldName} должно быть положительным числом.`);
    }
  };

  const handleInputChange = (setter) => (e) => {
    const value = Number(e.target.value);
    try {
      validateInput(value, e.target.name);
      setter(value);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const SlabVisualization = ({ slabWidth, slabHeight, placements, scale }) => (
    <svg width={slabWidth * scale} height={slabHeight * scale} className="border border-gray-300">
      <rect width="100%" height="100%" fill="#f0f0f0" />
      {placements.map((placement, index) => {
        let yOffset = 0;
        return [...Array(placement.down)].map((_, row) => {
          let xOffset = 0;
          return [...Array(placement.across)].map((_, col) => {
            const piece = (
              <rect
                key={`${index}-${row}-${col}`}
                x={xOffset * scale}
                y={yOffset * scale}
                width={placement.width * scale}
                height={placement.height * scale}
                fill={placement.color}
                stroke="#000"
              />
            );
            xOffset += placement.width;
            if (col === placement.across - 1) {
              yOffset += placement.height;
            }
            return piece;
          });
        });
      })}
    </svg>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto p-4">
      <CardHeader>
        <CardTitle className="text-2xl">Мультидетальный оптимизатор раскроя</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="slabWidth" className="block text-lg font-medium text-gray-700">Ширина слаба (мм)</label>
              <Input 
                id="slabWidth" 
                name="Ширина слаба"
                type="number" 
                value={slabWidth} 
                onChange={handleInputChange(setSlabWidth)} 
                className="text-lg p-3" 
              />
            </div>
            <div>
              <label htmlFor="slabHeight" className="block text-lg font-medium text-gray-700">Высота слаба (мм)</label>
              <Input 
                id="slabHeight" 
                name="Высота слаба"
                type="number" 
                value={slabHeight} 
                onChange={handleInputChange(setSlabHeight)} 
                className="text-lg p-3" 
              />
            </div>
          </div>
          
          <div className="space-y-4">
            {pieces.map((piece, index) => (
              <div key={index} className="flex flex-col space-y-2 p-4 border rounded-lg" style={{borderColor: piece.color}}>
                <div className="flex justify-between items-center">
                  <Input 
                    value={piece.name} 
                    onChange={(e) => updatePiece(index, 'name', e.target.value)}
                    className="text-lg font-medium"
                  />
                  <Button onClick={() => removePiece(index)} variant="ghost" size="sm">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ширина (мм)</label>
                    <Input 
                      type="number" 
                      name={`Ширина детали "${piece.name}"`}
                      value={piece.width} 
                      onChange={(e) => {
                        try {
                          const value = Number(e.target.value);
                          validateInput(value, `Ширина детали "${piece.name}"`);
                          updatePiece(index, 'width', value);
                          setError(null);
                        } catch (err) {
                          setError(err.message);
                        }
                      }}
                      className="text-lg p-3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Высота (мм)</label>
                    <Input 
                      type="number" 
                      name={`Высота детали "${piece.name}"`}
                      value={piece.height} 
                      onChange={(e) => {
                        try {
                          const value = Number(e.target.value);
                          validateInput(value, `Высота детали "${piece.name}"`);
                          updatePiece(index, 'height', value);
                          setError(null);
                        } catch (err) {
                          setError(err.message);
                        }
                      }}
                      className="text-lg p-3"
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button onClick={addPiece} className="w-full text-lg py-6">
              <Plus className="mr-2 h-5 w-5" /> Добавить деталь
            </Button>
          </div>
          
          {result && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <h3 className="text-xl font-semibold mb-4">Результаты оптимизации:</h3>
              {result.placements.map((placement, index) => (
                <p key={index} className="text-lg">
                  {placement.name}: {placement.count} шт.
                </p>
              ))}
              <p className="text-lg mt-2">Площадь отходов: {result.wasteArea.toFixed(2)} кв.мм</p>
              <div className="mt-4">
                <SlabVisualization
                  slabWidth={slabWidth}
                  slabHeight={slabHeight}
                  placements={result.placements}
                  scale={scale}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NestingOptimizer;
