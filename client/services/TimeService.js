export class TimeService {
  constructor() {
    this.offset = window.fetch('/api/time')
      .then(r => r.json())
      .then((serverTime) => serverTime - this.getRawTime())
  }

  getRawTime() {
    const date = new Date();
    return date.getTime() + (date.getTimezoneOffset() * 60000);// - 10 * 60 * 1000;
  }

  getTime() {
    return this.offset
      .then(offset => this.getRawTime() + offset)
  }

  formatTime(time) {
    let ms = time % 1000;
    time = (time - ms) / 1000;
    let s = time % 60;
    time = (time - s) / 60;
    let m = time % 60;
    time = (time - m) / 60;
    let h = time % 60;
    if (h < 10) h = '0' + h;
    if (m < 10) m = '0' + m;
    if (s < 10) s = '0' + s;
    return (h != '00' ? h + ':' : '') + m + ':' + s;
  }
}

export default new TimeService();