import { compile, acir_from_bytes } from '@noir-lang/noir_wasm';
import { setup_generic_prover_and_verifier, create_proof, verify_proof } from '@noir-lang/barretenberg/dest/client_proofs';
import { BarretenbergWasm } from '@noir-lang/barretenberg/dest/wasm';
import { SinglePedersen } from '@noir-lang/barretenberg/dest/crypto';
import { resolve } from 'path';
import { expect } from 'chai';
import { ethers } from "hardhat";
import { Contract, ContractFactory, utils } from 'ethers';
import { numToHex } from '../utils';

describe('Trivia solidity verifier', function () {
  let barretenberg: BarretenbergWasm;
  let pedersen: SinglePedersen;
  let Verifier: ContractFactory;
  let verifierContract: Contract;

  before(async () => {
    barretenberg = await BarretenbergWasm.new();
    pedersen = new SinglePedersen(barretenberg);
    Verifier = await ethers.getContractFactory("TriviaVerifier");
    verifierContract = await Verifier.deploy();
  });

  it("Should verify correct correctness (1) using proof generated by typescript wrapper", async () => {   
    const compiled_program = compile(resolve(__dirname, '../circuits/trivia/src/main.nr'));
    let acir = compiled_program.circuit;
    const abi = compiled_program.abi;

    abi.answer = 123456789;
    const solution_buffer = pedersen.compressInputs([abi.answer].map((e: number) => Buffer.from(numToHex(e), 'hex')));
    abi.answer_hash = `0x${solution_buffer.toString('hex')}`;
    abi.guess = 123456789;
    abi.correctness = 1;

    let [prover, verifier] = await setup_generic_prover_and_verifier(acir);

    const proof = await create_proof(prover, acir, abi);
    
    const verified = await verify_proof(verifier, proof);
    expect(verified).eq(true);

    const sc_verified = await verifierContract.verify(proof);
    expect(sc_verified).eq(true)
  });  

  it("Should verify correct correctness (0) using proof generated by typescript wrapper", async () => {   
    const compiled_program = compile(resolve(__dirname, '../circuits/trivia/src/main.nr'));
    let acir = compiled_program.circuit;
    const abi = compiled_program.abi;

    abi.answer = 123456789;
    const solution_buffer = pedersen.compressInputs([abi.answer].map((e: number) => Buffer.from(numToHex(e), 'hex')));
    abi.answer_hash = `0x${solution_buffer.toString('hex')}`;
    abi.guess = 987654321;
    abi.correctness = 0;

    let [prover, verifier] = await setup_generic_prover_and_verifier(acir);

    const proof = await create_proof(prover, acir, abi);
    
    const verified = await verify_proof(verifier, proof);
    expect(verified).eq(true);

    const sc_verified = await verifierContract.verify(proof);
    expect(sc_verified).eq(true)
  });  

  it("Should fail on incorrect correctness (1) using proof generated by typescript wrapper", async () => {   
    const compiled_program = compile(resolve(__dirname, '../circuits/trivia/src/main.nr'));
    let acir = compiled_program.circuit;
    const abi = compiled_program.abi;

    abi.answer = 123456789;
    const solution_buffer = pedersen.compressInputs([abi.answer].map((e: number) => Buffer.from(numToHex(e), 'hex')));
    abi.answer_hash = `0x${solution_buffer.toString('hex')}`;
    abi.guess = 987654321;
    abi.correctness = 1;

    let [prover, verifier] = await setup_generic_prover_and_verifier(acir);

    const proof = await create_proof(prover, acir, abi);
    
    const verified = await verify_proof(verifier, proof);
    expect(verified).eq(false);

    await expect(verifierContract.verify(proof)).to.be.revertedWith('Proof failed');
  });

  it("Should fail on incorrect correctness (0) using proof generated by typescript wrapper", async () => {   
    const compiled_program = compile(resolve(__dirname, '../circuits/trivia/src/main.nr'));
    let acir = compiled_program.circuit;
    const abi = compiled_program.abi;

    abi.answer = 123456789;
    const solution_buffer = pedersen.compressInputs([abi.answer].map((e: number) => Buffer.from(numToHex(e), 'hex')));
    abi.answer_hash = `0x${solution_buffer.toString('hex')}`;
    abi.guess = 123456789;
    abi.correctness = 0;

    let [prover, verifier] = await setup_generic_prover_and_verifier(acir);

    const proof = await create_proof(prover, acir, abi);
    
    const verified = await verify_proof(verifier, proof);
    expect(verified).eq(false);

    await expect(verifierContract.verify(proof)).to.be.revertedWith('Proof failed');
  });

});