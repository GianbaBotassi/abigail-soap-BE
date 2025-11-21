export function formatDateTime(dataString) {
    const data = new Date(dataString);
    const day = String(data.getDate()).padStart(2, '0');
    const month = String(data.getMonth() + 1).padStart(2, '0'); // i mesi partono da 0
    const year = data.getFullYear();
    const hours = String(data.getHours()).padStart(2, '0');
    const minutes = String(data.getMinutes()).padStart(2, '0');
  
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  export function formatDate(dataString) {
    const data = new Date(dataString);
    const day = String(data.getDate()).padStart(2, '0');
    const month = String(data.getMonth() + 1).padStart(2, '0'); // i mesi partono da 0
    const year = data.getFullYear();
  
    return `${day}/${month}/${year}`;
  }
  