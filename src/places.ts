// Where each house really is: the sky follows that spot's sunrise and sunset, and the
// clock shows its local time. (Also the place to ask for live weather.)

export interface Place { name: string; lat: number; lng: number; timeZone: string }

export const ALFEI_MENASHE: Place = { name: 'Alfei Menashe', lat: 32.164, lng: 35.0, timeZone: 'Asia/Jerusalem' };
export const JERUSALEM: Place = { name: 'Jerusalem', lat: 31.778, lng: 35.235, timeZone: 'Asia/Jerusalem' };
export const TEL_AVIV: Place = { name: 'Tel Aviv', lat: 32.058, lng: 34.772, timeZone: 'Asia/Jerusalem' };
