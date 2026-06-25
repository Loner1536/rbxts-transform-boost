type BitBufferFromStr = (inputStr: string) => BitBuffer;

/** Binary stream object for packing binary data. */
interface BitBuffer {
        /**
         * Resets the position of the cursor.
         * 
         * ```ts
         * buffer.WriteUInt(32, 890);
         * buffer.ResetCursor();
         * 
         * print(buffer.GetCursor()); --> 0
         * ```
         */
        ResetCursor(): void;

        /**
         * Sets the position of the cursor to the given position.
         * 
         * ```ts
         * buffer.WriteUInt(32, 67);
         * buffer.WriteUInt(32, 44);
         * 
         * buffer.SetCursor(32);
         * 
         * print(buffer.ReadUInt(32)); --> 44
         * ```
         * 
         * @param position The position to set the cursor to.
         */
        SetCursor(position: number): void;

        /**
         * Returns the position of the cursor.
         * 
         * ```ts
	 * buffer.WriteUInt(17, 901);
	 * buffer.WriteUInt(4, 2);
         * 
	 * print(buffer.GetCursor()); --> 21
         * ```
         */
        GetCursor(): number;

        /**
         * Clears the buffer, setting its size to zero, and sets its position to 0.
         * 
         * ```ts
	 * buffer.WriteUInt(32, math.pow(2, 32) - 1);
         * 
	 * buffer.ResetBuffer();
         * 
	 * print(buffer.GetCursor()); --> 0
	 * print(buffer.ReadUInt(32)); --> 0
	 * ```
         */
        ResetBuffer(): void;

        /**
         * Returns the size of the buffer.
         * 
         * ```ts
	 * buffer.WriteUInt(18, 618);
	 * print(buffer.GetSize()); --> 18
	 * ```
         */
        GetSize(): number;

        /**
         * Serializes the buffer into a binary string.
         * You can retrieve the buffer from this string using `BitBuffer.FromString`.
         * 
         * ```ts
	 * buffer.WriteUInt(8, 65);
	 * buffer.WriteUInt(8, 66);
	 * buffer.WriteUInt(8, 67);
         * 
	 * print(buffer.ToString()); --> "ABC"
	 * ```
         */
        ToString(): string;

        /**
         * Serializes the buffer into a Base64 string.
         * You can retrieve the buffer from this string using `BitBuffer.FromBase64`.
         * 
         * ```ts
	 * initialBuffer.WriteUInt(15, 919);
	 * initialBuffer.WriteString("Hello!");
         * 
	 * const b64 = initialBuffer.ToBase64();
	 * const newBuffer = BitBuffer.FromBase64(b64);
         * 
	 * print(newBuffer.ReadUInt(15)); --> 919
	 * print(newBuffer.ReadString()); --> "Hello!"
	 * ```
         */
        ToBase64(): string;
        
        /**
         * Serializes the buffer into a Base91 string.
	 * You can retrieve the buffer from this string using `BitBuffer.FromBase91`.
	 * **This is the recommended function to use for DataStores.**
         * 
         * ```ts
	 * buffer.WriteString(playerData.CustomName);
	 * buffer.WriteUInt(8, playerData.Level);
	 * buffer.WriteUInt(16, playerData.Money);
         * 
	 * SaveToDataStore(buffer.ToBase91());
	 * ```
         * 
         * ```ts
	 * const b91 = RetrieveFromDataStore();
	 * const buffer = BitBuffer.FromBase91(b91);
         * 
	 * const playerData = {
	 * 	CustomName: buffer.ReadString(),
	 * 	Level: buffer.ReadUInt(8),
	 * 	Money: buffer.ReadUInt(16),
	 * };
	 * ```
         */
        ToBase91(): string;

        /**
         * Serializes the buffer into a Base128 string.
         * You can retrieve the buffer from this string using `BitBuffer.FromBase128`.
         */
        ToBase128(): string;

        /**
         * Writes an unsigned integer of `bitWidth` bits to the buffer.
         * `bitWidth` must be an integer between 1 and 32.
         * If the input integer uses more bits than `bitWidth`, it will overflow as expected.
         * 
         * ```ts
         * buffer.WriteUInt(32, 560); // Writes 560 to the buffer
         * buffer.WriteUInt(3, 9); // Writes 0b101 (5) because 9 is 0b1101, but `bitWidth` is only 3!
         * ```
         * 
         * @param bitWidth The width of the bit.
         * @param uint The unsigned integer used.
         */
        WriteUInt(bitWidth: number, uint: number): void;

        /**
         * Reads `bitWidth` bits from the buffer as an unsigned integer.
         * `bitWidth` must be an integer between 1 and 32.
         * 
         * ```ts
         * buffer.WriteUInt(12, 89);
         * buffer.ResetCursor();
         * 
         * print(buffer.ReadUInt(12)); --> 89
         * ```
         * 
         * @param bitWidth The width of the bit.
         */
        ReadUInt(bitWidth: number): number;

        /**
         * Writes a signed integer of `bitWidth` bits using [two's complement](https://en.wikipedia.org/wiki/Two%27s_complement).
         * `bitWidth` must be an integer between 1 and 32.
         * Overflow is **untested**, use at your own risk.
         * 
         * ```ts
         * buffer.WriteInt(22, -901); // Writes -901 to the buffer
         * ```
         * 
         * @param bitWidth The width of the bit.
         * @param int The signed integer used.
         */
        WriteInt(bitWidth: number, int: number): void;

        /**
         * Reads `bitWidth` bits as a signed integer stored using [two's complement](https://en.wikipedia.org/wiki/Two%27s_complement).
         * `bitWidth` must be an integer between 1 and 32.
         * 
         * ```ts
         * buffer.WriteInt(15, -78);
         * buffer.ResetCursor();
         * 
         * print(buffer.ReadInt(15)); --> -78
         * ```
         * 
         * @param bitWidth The width of the bit.
         */
        ReadInt(bitWidth: number): number;

        /**
         * Writes one bit the buffer: 1 if `value` is truthy, 0 otherwise.
         * 
         * ```ts
         * buffer.WriteBool(true); // Writes 1
         * buffer.WriteBool("A"); // Also writes 1
         * buffer.WriteBool(nil) // Writes 0
         * ```
         * 
         * @param value The value used to determine the boolean based on its truthy/falsy nature.
         */
        WriteBool(value: unknown): void;

        /**
         * Reads one bit from the buffer and returns a boolean: true if the bit is 1, false if the bit is 0.
         * 
         * ```ts
         * buffer.WriteUInt(4, 0b1011);
         * buffer.ResetCursor();
         * 
         * print(buffer.ReadBool()) --> true
         * print(buffer.ReadBool()) --> true
         * print(buffer.ReadBool()) --> false
         * print(buffer.ReadBool()) --> true
         * ```
         */
        ReadBool(): boolean;

        /**
         * Writes one ASCII character (one byte) to the buffer.
         * `char` cannot be an empty string.
         * 
         * ```ts
         * buffer.WriteChar("k");
         * buffer.ResetCursor();
         * 
         * print(buffer.ReadChar()); --> "k"
         * ```
         * 
         * @param char The ASCII character used.
         */
        WriteChar(char: string): void;

        /**
         * Reads one byte as an ASCII character from the buffer.
         * 
         * ```ts
         * buffer.WriteUInt(8, 65);
         * buffer.ResetCursor();
         * 
         * print(buffer.ReadChar()); --> "A"
         * ```
         */
        ReadChar(): string;

        /**
         * Writes a stream of bytes to the buffer.
         * if `bytes` is an empty string, nothing will be written.
         * 
         * ```ts
         * buffer.WriteBytes("AD");
         * buffer.ResetCursor();
         * 
         * print(buffer.ReadUInt(8), buffer.ReadUInt(8)); --> 65 68
         * ```
         * 
         * @param bytes The stream of bytes used.
         */
        WriteBytes(bytes: string): void;

        /**
         * Reads `length` bytes as a string from the buffer.
         * if `length` is 0, nothing will be read and an empty string will be returned.
         * 
         * ```ts
         * buffer.WriteUInt(8, 65);
         * buffer.WriteUInt(8, 67);
         * 
         * print(buffer.ReadBytes(2)); --> "AC"
         * ```
         * 
         * @param length The amount of bytes to read from the buffer.
         */
        ReadBytes(length: number): string;

        /**
         * Writes a string to the buffer.
         * 
         * WriteString will write the length of the string as a 24-bit unsigned integer first, then write the bytes in the string.
         * The length of the string cannot be greater than `2^24 - 1 (16777215)`.
         * 
         * ```ts
         * buffer.WriteString("AB");
         * buffer.ResetCursor();
         * 
         * print(buffer.ReadUInt(24), buffer.ReadBytes(2)); --> 2 "AB"
         * ```
         * @param str The string used.
         */
        WriteString(str: string): void;

        /**
         * Reads a string from the buffer.
         * 
         * ```ts
         * buffer.WriteString("Hello!");
         * buffer.ResetCursor();
         * 
         * print(buffer.ReadString()); --> "Hello!"
         * ```
         */
        ReadString(): string;

        /**
         * Writes a single-precision floating point number to the buffer.
         * 
         * ```ts
         * buffer.WriteFloat32(892.738);
         * buffer.ResetCursor();
         * 
         * print(buffer.ReadFloat32()); --> 892.73797607421875
         * ```
         * @param float The float used.
         */
        WriteFloat32(float: number): void;

        /**
         * Reads a single-precision floating point number from the buffer.
         */
        ReadFloat32(): number;

        /**
         * Writes a double-precision floating point number to the buffer.
         * 
         * ```ts
         * buffer.WriteFloat64(-76358128.888202341);
         * buffer.ResetCursor();
         * 
         * print(buffer.ReadFloat64()); --> -76358128.888202
         * ```
         * 
         * @param double The double used.
         */
        WriteFloat64(double: number): void;

        /**
         * Reads a double-precision floating point number from the buffer.
         */
        ReadFloat64(): number;
}

interface BitBufferConstructor {
        /**
         * Creates a new BitBuffer with an initial size of `sizeInBits`.
         * 
         * ```ts
         * const buffer = new BitBuffer(128);
         * print(buffer.GetSize()); --> 128
         * ```
         * 
         * @param sizeInBits Initial size of the buffer in bits (defaults to 0)
         */
        new(sizeInBits?: number): BitBuffer;

        /**
         * Returns whether the passed value is a BitBuffer.
         * 
         * ```ts
         * print(BitBuffer.is(new BitBuffer())); --> true
	 * print(BitBuffer.is(true)); --> false
         * ```
         * 
         * @param value The value to type check.
         */
        is: (value: unknown) => value is BitBuffer;

        /**
         * Creates a new BitBuffer from a binary string, starting with a size corresponding to number of bits in the input string (8 bits per character), and it's cursor positioned at 0.
         * 
         * ```ts
         * const buffer = BitBuffer.FromString("\89");
         * 
         * print(buffer.ReadUInt(8)); --> 89
         * print(buffer.GetSize()); --> 8
         * ```
         * 
         * @param inputStr The binary string used.
         */
        FromString: BitBufferFromStr;

        /**
         * Creates a new BitBuffer from a Base64 string, starting with a size corresponding to the number of bits stored in the input string (6 bits per character), and it's cursor positioned at 0.
         * 
         * ```ts
         * const str = base64("\45\180");
         * const buffer = BitBuffer.FromBase64(str);
         * 
         * print(buffer.ReadUInt(8)); --> 45
         * print(buffer.ReadUInt(8)); --> 180
         * ```
         * 
         * @param inputStr The binary string used.
         */
        FromBase64: BitBufferFromStr;

        /**
         * Creates a new BitBuffer from a Base91 string, starting with a size corresponding to the number of bits stored in the input string, and it's cursor positioned at 0.
	 * **This is the recommended function to use for DataStores.**
         * ### What is Base91?
         * Base91 is a way to pack binary data into text, similar to Base64.
         * It is, on average, about 10% more efficient than Base64. Check [this page](http://base91.sourceforge.net) to learn more.
         * 
         * ```ts
         * const initialBuffer = new BitBuffer();
         * initialBuffer.WriteUInt(32, 78);
         * initialBuffer.WriteString("Hi");
         * 
         * const b91 = initialBuffer.ToBase91();
         * const newBuffer = BitBuffer.FromBase91(b91);
         * 
         * print(newBuffer.ReadUInt(32)); --> 78
         * print(newBuffer.ReadString()); --> Hi
         * ```
         * 
         * @param inputStr The binary string used.
         */
        FromBase91: BitBufferFromStr;

        /**
         * Creates a new BitBuffer from a Base128 string, starting with a size corresponding to the number of bits stored in the input string (7 bits per character), and it's cursor positioned at 0.
         * 
         * ```ts
         * const str = base128("\255\12");
         * const buffer = BitBuffer.FromBase128(str);
         * 
         * print(buffer.ReadUInt(8)); --> 255
         * print(buffer.ReadUInt(8)); --> 12
         * ```
         * 
         * @param inputStr The binary string used.
         */
        FromBase128: BitBufferFromStr;
}

declare const BitBuffer: BitBufferConstructor;

export = BitBuffer;