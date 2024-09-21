function Notifier() {
  this.user_permitted = false
}

Notifier.prototype.init = async function() {
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notifications.")
    return;
  }

  if (Notification.permission === "granted") {
    this.user_permitted = true
    return this.user_permitted;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    this.user_permitted = permission === "granted"

    return this.user_permitted;
  }

  return false;
};

Notifier.prototype.send = function(title, message) {
  if (!this.user_permitted) return false;

  message = message.trim();
  title = title.trim();

  if (!(message && title)) return false;

  new Notification(title, {
    body: message
  })
};

export default Notifier;
