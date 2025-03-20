'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Lottie with no SSR
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

interface LoadingAnimationProps {
  text?: string;
  className?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  text = 'Loading...', 
  className = '' 
}) => {
  const [animation, setAnimation] = useState<any>(null);
  
  // Load the animation data only on the client side
  useEffect(() => {
    import('../../public/animations/loading-animation.json')
      .then(animationData => {
        setAnimation(animationData.default);
      })
      .catch(err => {
        console.error('Failed to load animation:', err);
      });
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="w-40 h-40">
        {animation ? (
          <Lottie
            animationData={animation}
            loop={true}
            autoplay={true}
          />
        ) : (
          // Fallback spinner for when animation is loading or for SSR
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black dark:border-white"></div>
          </div>
        )}
      </div>
      {text && (
        <p className="mt-4 text-lg font-medium text-gray-600 dark:text-gray-300">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingAnimation; 