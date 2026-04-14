import React from 'react';

const Loader = () => {
  return (
    <div className="flex justify-center items-center h-full w-full py-10">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-flipkartBlue"></div>
    </div>
  );
};

export default Loader;
