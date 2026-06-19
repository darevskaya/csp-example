const es = new EventSource('/__reload');
es.onmessage = () => location.reload();
