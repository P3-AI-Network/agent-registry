import { AbstractPrivateKeyStore, AgentResolver, BjjProvider, core, CredentialStatusPublisherRegistry, CredentialStatusResolverRegistry, CredentialStatusType, CredentialStorage, CredentialWallet, defaultEthConnectionConfig, EthConnectionConfig, EthStateStorage, ICredentialWallet, IDataStorage, Iden3SmtRhsCredentialStatusPublisher, Identity, IdentityStorage, IdentityWallet, IIdentityWallet, InMemoryDataSource, InMemoryMerkleTreeStorage, InMemoryPrivateKeyStore, IssuerResolver, KMS, KmsKeyType, OnChainResolver, Profile, RHSResolver, W3CCredential } from "@0xpolygonid/js-sdk";


const RHS_URL = "https://rhs-staging.polygonid.me";


const defaultNetworkConnection: EthConnectionConfig = {
    url: "https://rpc.ankr.com/polygon_amoy",
    contractAddress: "0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124",
    defaultGasLimit: 21000,
    confirmationBlockCount: 1,
    confirmationTimeout: 10,
    receiptTimeout: 10,
    rpcResponseTimeout: 10,
    waitReceiptCycleTime: 10,
    waitBlockCycleTime: 10,
    chainId: 80002
};


type NetworkConfig = {
    contractAddress: string;
    rpcUrl: string;
    chainId: number;
};


async function initCredentialWallet(dataStorage: IDataStorage): Promise<CredentialWallet> {
    const resolvers = new CredentialStatusResolverRegistry();
    resolvers.register(CredentialStatusType.SparseMerkleTreeProof, new IssuerResolver());
    resolvers.register(
        CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
        new RHSResolver(dataStorage.states)
    );
    resolvers.register(
        CredentialStatusType.Iden3OnchainSparseMerkleTreeProof2023,
        new OnChainResolver([defaultEthConnectionConfig])
    );
    resolvers.register(CredentialStatusType.Iden3commRevocationStatusV1, new AgentResolver());

    return new CredentialWallet(dataStorage, resolvers);
}

function initInMemoryDataStorage({
    contractAddress,
    rpcUrl,
    chainId
}: NetworkConfig): IDataStorage {
    const conf: EthConnectionConfig = {
        ...defaultEthConnectionConfig,
        contractAddress,
        url: rpcUrl,
        chainId
    };

    // change here priority fees in case transaction is stuck or processing too long
    // conf.maxPriorityFeePerGas = '250000000000' - 250 gwei
    // conf.maxFeePerGas = '250000000000' - 250 gwei

    const dataStorage = {
        credential: new CredentialStorage(new InMemoryDataSource<W3CCredential>()),
        identity: new IdentityStorage(
            new InMemoryDataSource<Identity>(),
            new InMemoryDataSource<Profile>()
        ),
        mt: new InMemoryMerkleTreeStorage(40),
        states: new EthStateStorage(conf)
    };

    return dataStorage;
}


async function initIdentityWallet(
    dataStorage: IDataStorage,
    credentialWallet: ICredentialWallet,
    keyStore: AbstractPrivateKeyStore
): Promise<IIdentityWallet> {
    const bjjProvider = new BjjProvider(KmsKeyType.BabyJubJub, keyStore);
    const kms = new KMS();
    kms.registerKeyProvider(KmsKeyType.BabyJubJub, bjjProvider);
    kms.registerKeyProvider(KmsKeyType.Ed25519, bjjProvider);


    const credentialStatusPublisherRegistry = new CredentialStatusPublisherRegistry();
    credentialStatusPublisherRegistry.register(
        CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
        new Iden3SmtRhsCredentialStatusPublisher()
    );

    return new IdentityWallet(kms, dataStorage, credentialWallet, {
        credentialStatusPublisherRegistry
    });
}



export async function createIdentity(seed: Uint8Array<ArrayBufferLike>): Promise<{ identifier: string, did: string }> {

    const dataStorage = initInMemoryDataStorage({
        contractAddress: defaultNetworkConnection.contractAddress,
        rpcUrl: defaultNetworkConnection.url,
        chainId: defaultEthConnectionConfig.chainId!
    })

    const credentialWallet = await initCredentialWallet(dataStorage);
    const memoryKeyStore = new InMemoryPrivateKeyStore();

    const identityWallet = await initIdentityWallet(dataStorage, credentialWallet, memoryKeyStore);
    const { did, credential } = await identityWallet.createIdentity({
        method: core.DidMethod.PolygonId,
        blockchain: core.Blockchain.Polygon,
        networkId: core.NetworkId.Amoy,
        seed: seed,
        revocationOpts: {
            id: RHS_URL,
            type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof
        }
    });

    return {
        identifier: `did:${did.method}:${did.id}`,
        did: JSON.stringify(credential)
    }
}

export function seedToBase64(seed: Uint8Array): string {
    return btoa(String.fromCharCode(...seed));
}

export function  base64ToSeed(base64: string): Uint8Array {
    return new Uint8Array([...atob(base64)].map(char => char.charCodeAt(0)));
}

export function generateSeed(length: number = 32): Uint8Array {
    const seed = new Uint8Array(length);
    crypto.getRandomValues(seed);
    return seed;
}