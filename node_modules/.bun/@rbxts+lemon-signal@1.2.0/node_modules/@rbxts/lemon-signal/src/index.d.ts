interface Connection {
	Connected: boolean;

	Disconnect(): void;
	Reconnect(): void;
}

type SignalCallback = (...args: any[]) => any;
type SignalGeneric = SignalCallback | defined[] | defined;

type GetSignalCallback<T extends SignalGeneric> = T extends SignalCallback
	? T
	: T extends defined[]
		? (...args: T) => void
		: T extends defined
			? (arg: T) => void
			: () => void;

type SignalParams<T extends SignalCallback> = T extends (...args: infer U) => any ? U : never;

interface Signal<T extends SignalGeneric = () => void> {
	Connect(callback: GetSignalCallback<T>): Connection;
	Once(callback: GetSignalCallback<T>): Connection;
	Wait(): SignalParams<GetSignalCallback<T>>;
	Fire(...args: SignalParams<GetSignalCallback<T>>): void;
	DisconnectAll(): void;
	Destroy(): void;
}

interface SignalConstructor {
	is: <T extends SignalGeneric = (...args: any[]) => void>(val: unknown) => val is Signal<T>;
	wrap: <T extends Callback>(signal: RBXScriptSignal<T>) => Signal<T>;
	new <T extends SignalGeneric = () => void>(): Signal<T>;
}

declare const Signal: SignalConstructor;

export default Signal;
export { Signal, Connection, GetSignalCallback };
