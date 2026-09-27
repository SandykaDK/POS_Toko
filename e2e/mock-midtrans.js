import { createServer } from 'node:http';

const qrImage = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/G7sAAAAASUVORK5CYII=',
    'base64',
);

const server = createServer(async (request, response) => {
    if (request.url === '/health') {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ success: true }));
        return;
    }

    if (request.method === 'POST' && request.url === '/v2/charge') {
        let requestBody = '';
        for await (const chunk of request) requestBody += chunk;

        const payload = JSON.parse(requestBody);
        const invoice = payload.transaction_details.order_id;
        if (payload.transaction_details.gross_amount === 13) {
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ status_message: 'Mock provider unavailable' }));
            return;
        }

        response.writeHead(201, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({
            transaction_id: `mock-${invoice}`,
            actions: [{ name: 'generate-qr-code', url: 'http://127.0.0.1:9325/qr' }],
        }));
        return;
    }

    if (request.method === 'GET' && request.url === '/qr') {
        response.writeHead(200, { 'Content-Type': 'image/png' });
        response.end(qrImage);
        return;
    }

    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: 'Not found' }));
});

server.listen(9325, '127.0.0.1');
