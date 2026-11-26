import ResourceView from '../components/ResourceView';
import { messagesConfig } from './resourceConfigs';

/** Messages (AA6.12): mail between agents and from people, with the ones loop guards refused, under Autonomy. */
export default function MessagesView() {
  return <ResourceView config={messagesConfig} />;
}
