import React from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = "md",
  showLabel = false 
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return "매우 나쁨";
      case 2: return "나쁨";
      case 3: return "보통";
      case 4: return "좋음";
      case 5: return "매우 좋음";
      default: return "";
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((starNumber) => (
          <button
            key={starNumber}
            type="button"
            onClick={() => handleStarClick(starNumber)}
            disabled={readonly}
            className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform duration-150 ${
              readonly ? "" : "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 rounded"
            }`}
          >
            <Star
              className={`${sizeClasses[size]} ${
                starNumber <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              } transition-colors duration-150`}
            />
          </button>
        ))}
      </div>
      
      {showLabel && rating > 0 && (
        <span className="text-sm text-muted-foreground ml-2">
          {getRatingLabel(rating)}
        </span>
      )}
    </div>
  );
};

export default StarRating;