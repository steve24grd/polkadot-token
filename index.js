// Import required dependencies
// You'll need to install these first:
// npm install @polkadot/api @polkadot/types

const { ApiPromise, WsProvider } = require('@polkadot/api');

async function getTokenInfo(wsEndpoint, chainId, tokenSymbol) {
    try {
        // Create WebSocket provider
        const provider = new WsProvider(wsEndpoint);

        // Create the API instance
        const api = await ApiPromise.create({ provider });

        // Wait until we are ready and connected
        await api.isReady;

        // Get chain information
        const [chain, nodeName, nodeVersion] = await Promise.all([
            api.rpc.system.chain(),
            api.rpc.system.name(),
            api.rpc.system.version()
        ]);

        console.log(`Connected to chain ${chain} using ${nodeName} v${nodeVersion}`);

        // Get token information
        const properties = await api.rpc.system.properties();
        const tokenDecimals = properties.tokenDecimals.unwrap()[0].toNumber();
        const tokenSymbols = properties.tokenSymbol.unwrap()[0].toString();

        // Get total issuance
        const totalIssuance = await api.query.balances.totalIssuance();

        // Format total issuance with proper decimals
        const formattedIssuance = totalIssuance.toBigInt() / BigInt(10 ** tokenDecimals);

        // Get token metadata if available
        let metadata = {};
        try {
            if (api.query.assets) {
                const assetInfo = await api.query.assets.metadata(chainId);
                metadata = {
                    name: assetInfo.name.toString(),
                    symbol: assetInfo.symbol.toString(),
                    decimals: assetInfo.decimals.toNumber()
                };
            }
        } catch (error) {
            console.log('Asset metadata not available');
        }

        // Compile results
        const tokenInfo = {
            chainId,
            requestedSymbol: tokenSymbol,
            nativeSymbol: tokenSymbols,
            decimals: tokenDecimals,
            totalSupply: formattedIssuance.toString(),
            metadata,
            chainInfo: {
                name: chain.toString(),
                nodeName: nodeName.toString(),
                nodeVersion: nodeVersion.toString()
            }
        };

        console.log('Token Information:', JSON.stringify(tokenInfo, null, 2));

        // Disconnect from the chain
        await api.disconnect();
        return tokenInfo;

    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Example usage
async function main() {
    const wsEndpoint = 'wss://mlg1.mandalachain.io';  // Replace with actual endpoint
    const chainId = '6025';  // Replace with actual chain ID
    const tokenSymbol = 'KPGT';  // Replace with actual token symbol

    try {
        await getTokenInfo(wsEndpoint, chainId, tokenSymbol);
    } catch (error) {
        console.error('Failed to get token information:', error);
    }
}

// Run the script
main().catch(console.error);