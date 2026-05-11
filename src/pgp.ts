import {
  readKey,
  readPrivateKey,
  decryptKey,
  encrypt,
  decrypt,
  createMessage,
  readMessage,
  type PrivateKey,
} from 'openpgp';

import {
  BadPassphraseError,
  DecryptError,
  EncryptError,
  MalformedKeyError,
  MalformedMessageError,
} from './types';

export async function encryptText({
  plaintext,
  publicKeyArmored,
}: {
  plaintext: string;
  publicKeyArmored: string;
}): Promise<string> {
  let publicKey;
  try {
    publicKey = await readKey({ armoredKey: publicKeyArmored });
  } catch {
    throw new MalformedKeyError();
  }

  try {
    const message = await createMessage({ text: plaintext });
    const armored = await encrypt({ message, encryptionKeys: publicKey });
    return armored as string;
  } catch {
    throw new EncryptError();
  }
}

export async function decryptText({
  ciphertext,
  privateKeyArmored,
  passphrase,
}: {
  ciphertext: string;
  privateKeyArmored: string;
  passphrase: string;
}): Promise<string> {
  let privateKey: PrivateKey;
  try {
    privateKey = await readPrivateKey({ armoredKey: privateKeyArmored });
  } catch {
    throw new MalformedKeyError();
  }

  let unlocked: PrivateKey;
  if (privateKey.isDecrypted()) {
    unlocked = privateKey;
  } else {
    try {
      unlocked = await decryptKey({ privateKey, passphrase });
    } catch {
      throw new BadPassphraseError();
    }
  }

  let message;
  try {
    message = await readMessage({ armoredMessage: ciphertext });
  } catch {
    throw new MalformedMessageError();
  }

  try {
    const { data } = await decrypt({ message, decryptionKeys: unlocked });
    return data as string;
  } catch {
    throw new DecryptError();
  }
}
