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

  it("Should verify proof generated by typescript wrapper where 3 out of 3 answers are correct", async () => {   
    const compiled_program = compile(resolve(__dirname, '../circuits/trivia/src/main.nr'));
    let acir = compiled_program.circuit;
    const abi = compiled_program.abi;

    abi.answers = [123456789, 9876578, 134256743];
    const solution_buffer = pedersen.compressInputs(abi.answers.map((e: number) => Buffer.from(numToHex(e), 'hex')));
    abi.answers_hash = `0x${solution_buffer.toString('hex')}`;
    abi.options = [123456789, 1, 2, 3, 4, 5, 9876578, 6, 7, 8, 9, 134256743];
    abi.guesses = [123456789, 9876578, 134256743];
    abi.score = 3;

    let [prover, verifier] = await setup_generic_prover_and_verifier(acir);

    const proof = await create_proof(prover, acir, abi);
    
    const verified = await verify_proof(verifier, proof);
    expect(verified).eq(true);

    const sc_verified = await verifierContract.verify(proof);
    expect(sc_verified).eq(true)
  });  

  it("Should verify proof generated by typescript wrapper where 2 out of 3 answers are correct", async () => {   
    const compiled_program = compile(resolve(__dirname, '../circuits/trivia/src/main.nr'));
    let acir = compiled_program.circuit;
    const abi = compiled_program.abi;

    abi.answers = [123456789, 9876578, 134256743];
    const solution_buffer = pedersen.compressInputs(abi.answers.map((e: number) => Buffer.from(numToHex(e), 'hex')));
    abi.answers_hash = `0x${solution_buffer.toString('hex')}`;
    abi.options = [123456789, 1, 2, 3, 4, 5, 9876578, 6, 7, 8, 9, 134256743];
    abi.guesses = [123456789, 9876578, 567483920147];
    abi.score = 2;

    let [prover, verifier] = await setup_generic_prover_and_verifier(acir);

    const proof = await create_proof(prover, acir, abi);
    
    const verified = await verify_proof(verifier, proof);
    expect(verified).eq(true);

    const sc_verified = await verifierContract.verify(proof);
    expect(sc_verified).eq(true)
  });  

  it("Should verify proof generated by typescript wrapper where 1 out of 3 answers are correct", async () => {   
    const compiled_program = compile(resolve(__dirname, '../circuits/trivia/src/main.nr'));
    let acir = compiled_program.circuit;
    const abi = compiled_program.abi;

    abi.answers = [123456789, 9876578, 134256743];
    const solution_buffer = pedersen.compressInputs(abi.answers.map((e: number) => Buffer.from(numToHex(e), 'hex')));
    abi.answers_hash = `0x${solution_buffer.toString('hex')}`;
    abi.options = [123456789, 1, 2, 3, 4, 5, 9876578, 6, 7, 8, 9, 134256743];
    abi.guesses = [123456789, 987654567, 567483920147];
    abi.score = 1;

    let [prover, verifier] = await setup_generic_prover_and_verifier(acir);

    const proof = await create_proof(prover, acir, abi);
    
    const verified = await verify_proof(verifier, proof);
    expect(verified).eq(true);

    const sc_verified = await verifierContract.verify(proof);
    expect(sc_verified).eq(true)
  });

  it("Should fail on incorrect proof", async () => {   
    const compiled_program = compile(resolve(__dirname, '../circuits/trivia/src/main.nr'));
    let acir = compiled_program.circuit;
    const abi = compiled_program.abi;

    abi.answers = [123456789, 9876578, 134256743];
    const solution_buffer = pedersen.compressInputs(abi.answers.map((e: number) => Buffer.from(numToHex(e), 'hex')));
    abi.answers_hash = `0x${solution_buffer.toString('hex')}`;
    abi.options = [123456789, 1, 2, 3, 4, 5, 9876578, 6, 7, 8, 9, 134256743];
    abi.guesses = [123456789, 9876578, 134256743];
    abi.score = 0;

    let [prover, verifier] = await setup_generic_prover_and_verifier(acir);

    const proof = await create_proof(prover, acir, abi);
    
    const verified = await verify_proof(verifier, proof);
    expect(verified).eq(false);

    await expect(verifierContract.verify(proof)).to.be.revertedWith('Proof failed');
  });

});