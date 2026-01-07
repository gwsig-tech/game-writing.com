
export async function isUrlLive(url: string): Promise<boolean> {
    try {
      // We use a short timeout so the user doesn't wait forever
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3000);
  
      const response = await fetch(url, { 
        method: 'GET', 
        mode: 'no-cors', // Helps bypass some browser security restrictions
        signal: controller.signal 
      });
      
      clearTimeout(id);
      return true; // If fetch doesn't throw, we assume it's reachable
    } catch (e) {
      return false;
    }
  }