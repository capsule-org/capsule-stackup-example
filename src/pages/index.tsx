import Capsule, { Environment, CapsuleEthersSigner } from '@usecapsule/web-sdk';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Client, Presets } from "userop";

// Dynamically import only the React component
const DynamicCapsuleButton = dynamic(
  () =>
    import('@usecapsule/web-sdk').then(
      (res) => res.Button
    ),
  {
    loading: () => <div></div>,
    ssr: false,
  }
);

let capsuleGlobal;

const CapsuleInstance = () => {
  const [capsuleInput, setCapsuleInput] = useState<Capsule | null>(null);
  const [appNameInput, setAppNameInput] = useState("");

  useEffect(() => {
    const initCapsule = async () => {
      setCapsuleInput(capsuleGlobal);
    }

    initCapsule()
  }, [capsuleInput])

  // Return the component only when capsuleInstance is ready
  if (!capsuleInput) return <div></div>;

  return <DynamicCapsuleButton capsule={capsuleGlobal} appName={"Capsule Stackup Example"} />;
};



const entryPoint = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const simpleAccountFactory = "0x9406Cc6185a346906296840746125a0E44976454";
const pmContext = {
  type: "payg",
};

export default function Home() {
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState<Presets.Builder.SimpleAccount | null>(
    null
  );

  const [events, setEvents] = useState<string[]>([
    `A sample application to demonstrate how to integrate self-custodial\nsocial login and transacting with Capsule and userop.js.`,
  ]);
  
  const CAPSULE_API_KEY = process.env.NEXT_PUBLIC_CAPSULE_API_KEY;
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  const pmUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL;
  const chain = process.env.NEXT_PUBLIC_CHAIN;

  if (!CAPSULE_API_KEY) {
    throw new Error("CAPSULE_API_KEY is undefined");
  }

  if (!rpcUrl) {
    throw new Error("RPC_URL is undefined");
  }

  if (!pmUrl) {
    throw new Error("PAYMASTER_RPC_URL is undefined");
  }

  if (!chain) {
    throw new Error("chain is undefined");
  }

  const paymaster = true
    ? Presets.Middleware.verifyingPaymaster(pmUrl, pmContext)
    : undefined;
  
    useEffect(() => {

      const initCapsule = async () => {
        await import('@usecapsule/web-sdk').then(CapsuleModule => {
          const Capsule = CapsuleModule.default;
          capsuleGlobal = new Capsule(Environment.BETA, undefined, {});
          setCapsule(capsuleGlobal);
        })
      }

      initCapsule()

    const updateLoginStatus = async () => {
      if (!capsule) return;
      const isLoggedIn = await capsule.isSessionActive();
      if (isLoggedIn) {
        // Instantiate Ethers Signer
        const provider = new ethers.JsonRpcProvider(
          rpcUrl,
          chain
        );
        let signer = new CapsuleEthersSigner(capsule, provider);
        // Uncomment the below to use a Viem client instead
        // let signer = createCapsuleViemClient(capsule, {
        //   chain: chain,
        //   transport: http(rpcUrl),
        // });
        setSigner(signer);
        const acc = await createAccount(signer);
        setAccount(acc)
      }
    };
    updateLoginStatus();

    const intervalId = setInterval(updateLoginStatus, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const createAccount = async (signer) => {
    return await Presets.Builder.SimpleAccount.init(
      signer as any,
      rpcUrl,
      entryPoint,
      simpleAccountFactory,
      paymaster
    );
  };

  const logout = async () => {
    if (!capsule) return;
    await capsule.logout();
    setAccount(null);
  };

  const addEvent = (newEvent: string) => {
    setEvents((prevEvents) => [...prevEvents, newEvent]);
  };

  const sendTransaction = async (recipient: string, amount: string) => {
    setEvents([]);
    if (!account) {
      throw new Error("Account not initialized");
    }
    addEvent("Sending transaction...");

    const client = await Client.init(rpcUrl, entryPoint);

    const target = ethers.getAddress(recipient);
    const value = ethers.parseEther(amount);
    const res = await client.sendUserOperation(
      account.execute(target, value, "0x"),
      {
        onBuild: async (op) => {
          addEvent(`Signed UserOperation: `);
          addEvent(JSON.stringify(op, null, 2) as any);
        },
      }
    );
    addEvent(`UserOpHash: ${res.userOpHash}`);

    addEvent("Waiting for transaction...");
    const ev = await res.wait();
    addEvent(`Transaction hash: ${ev?.transactionHash ?? null}`);
  };

  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24`}
    >
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div></div>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
            <div className="space-y-4">
              <div className="flex justify-end space-x-4">
                {signer ? 
                <p className="flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                  Capsule Stackup Example
                </p> : <CapsuleInstance />}

                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 self-center"
                >
                  Logout
                </button>
              </div>
              <div>
                <div className="grid grid-cols-3 grid-rows-2 gap-4">
                  <div className="col-span-1 row-span-2">
                    <button
                      className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                      onClick={() =>
                        sendTransaction(
                          "0x5DF100D986A370029Ae8F09Bb56b67DA1950548E",
                          "0"
                        )
                      }
                    >
                      <h2 className={`mb-3 text-2xl font-semibold`}>
                        Transfer{" "}
                      </h2>
                      <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
                        Simple transfer of 0 ETH to an arbitrary address with
                        gas sponsored.
                      </p>
                    </button>
                  </div>
                  <div className="overflow-scroll col-start-2 col-span-2 row-span-2 border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                    <div className="w-[1000px]">
                      <div className="block whitespace-pre-wrap justify-center ">
                        <pre>{events.join(`\n`)}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </main>
  );
}
