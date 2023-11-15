import nats from 'nats';
import axios from 'axios';

const connect_nats = async () => {
  const publicIp = await axios.get('http://169.254.169.254/latest/meta-data/public-ipv4');

  const nc = await nats.connect({
    servers: `http://${publicIp.data}:4222`,
  });

  return nc
}

export default connect_nats;