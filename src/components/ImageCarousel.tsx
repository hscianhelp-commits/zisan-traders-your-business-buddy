import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
  autoScrollInterval?: number;
}

export default function ImageCarousel({ images, autoScrollInterval = 3000 }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const startAutoSlide = useCallback(() => {
    if (images.length <= 1) return;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, autoScrollInterval);
  }, [images.length, autoScrollInterval]);

  useEffect(() => {
    startAutoSlide();
    return () => clearInterval(intervalRef.current);
  }, [startAutoSlide]);

  const goTo = (index: number) => {
    setCurrentIndex(index);
    startAutoSlide();
  };

  if (images.length === 0) return null;

  return (
    <>
      {/* Inline Slider */}
      <div className="relative bg-black overflow-hidden">
        <div ref={trackRef} className="relative overflow-hidden">
          {images.map((img, i) => (
            <div
              key={i}
              className="w-full transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(${(i - currentIndex) * 100}%`,
                position: i === 0 ? "relative" : "absolute",
                top: 0,
                left: 0,
              }}
            >
              <img
                src={img}
                alt=""
                className="w-full max-h-[320px] min-h-[180px] object-cover block cursor-pointer"
                onClick={() => {
                  setFullscreen(true);
                  setCurrentIndex(i);
                }}
              />
            </div>
          ))}
        </div>

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-[5px] pointer-events-none">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "bg-white w-4" : "bg-white/50 w-1.5"
                }`}
              />
            ))}
          </div>
        )}

        {/* Counter */}
        {images.length > 1 && (
          <span className="absolute top-2 right-2.5 bg-black/55 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full pointer-events-none">
            {currentIndex + 1}/{images.length}
          </span>
        )}
      </div>

      {/* Fullscreen Viewer */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={() => setFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white z-10 bg-white/20 rounded-full p-2"
            onClick={() => setFullscreen(false)}
          >
            <X size={20} />
          </button>

          {images.length > 1 && (
            <>
              <button
                className="absolute left-2 z-10 text-white bg-white/20 rounded-full p-2"
                onClick={(e) => { e.stopPropagation(); goTo((currentIndex - 1 + images.length) % images.length); }}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                className="absolute right-2 z-10 text-white bg-white/20 rounded-full p-2"
                onClick={(e) => { e.stopPropagation(); goTo((currentIndex + 1) % images.length); }}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <img
            src={images[currentIndex]}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
