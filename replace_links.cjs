const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'client/src/components/dashboard/ecosystem-dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Reemplazar todas las instancias de <Link href={tool.route}> con <SubscriptionLink href={tool.route}>
content = content.replace(/<Link href={tool\.route}>/g, '<SubscriptionLink href={tool.route}>');

// Reemplazar todas las instancias de </Link> con </SubscriptionLink>
content = content.replace(/<\/Link>/g, '</SubscriptionLink>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Reemplazo completado.');
