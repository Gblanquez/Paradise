export const setVw = () => {

    document.documentElement.style.setProperty('--vw', `${window.innerWidth / 100}px`);
  };
  
  export function initScaling() {
  
    setVw();
    
  
    window.addEventListener('resize', setVw);
    
  
    return () => {
      window.removeEventListener('resize', setVw);
    };
  }

