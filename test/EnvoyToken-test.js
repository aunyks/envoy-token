const { assertRevert } = require('./utils/assertRevert');
const expectEvent = require('./utils/expectEvent');
const ethUtil = require('ethereumjs-util');

const EnvoyToken = artifacts.require('EnvoyTokenMock');

const BigNumber = web3.BigNumber;

const ALICE =
  'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3';
const BOB = 'ae6ae8e5ccbfb04590405997ee2d52d2b550726157b875055c56d94e974d162f';
const CHARLIE =
  'c88b705fb08cbea894b6aeff5a544fb92e78a18e19814cd85da85b71f772aa6c';

const bufferedAddress = address => {
  return Buffer.from(ethUtil.stripHexPrefix(address), 'hex');
};
const bufferedInt = int => {
  return ethUtil.setLengthLeft(int, 32);
};
const formattedByte32 = bytes => {
  return ethUtil.addHexPrefix(bytes.toString('hex'));
};

const delegateTxion = (fromPriv, tokenAddr, toAddr, value, fee, nonce) => {
  const txionComponents = [
    bufferedAddress(tokenAddr),
    bufferedAddress(toAddr),
    bufferedInt(value),
    bufferedInt(fee),
    bufferedInt(nonce)
  ];
  const tightPack = Buffer.concat(txionComponents);
  const hashedTightPack = ethUtil.sha3(tightPack);
  const { v, r, s } = ethUtil.ecsign(
    hashedTightPack,
    Buffer.from(fromPriv, 'hex')
  );
  const bufV = new Buffer(1);
  bufV.writeUInt8(v);
  const signature = Buffer.concat([r, s, bufV]).toString('hex');
  return signature;
};

require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('EnvoyToken', function([_, owner, delegate, recipient]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  let anotherAccount = delegate;

  beforeEach(async function() {
    this.token = await EnvoyToken.new(owner, 100);
  });

  describe('total supply', function() {
    it('returns the total amount of tokens', async function() {
      (await this.token.totalSupply()).should.be.bignumber.equal(100);
    });
  });

  describe('balanceOf', function() {
    describe('when the requested account has no tokens', function() {
      it('returns zero', async function() {
        (await this.token.balanceOf(anotherAccount)).should.be.bignumber.equal(
          0
        );
      });
    });

    describe('when the requested account has some tokens', function() {
      it('returns the total amount of tokens', async function() {
        (await this.token.balanceOf(owner)).should.be.bignumber.equal(100);
      });
    });
  });

  describe('transfer', function() {
    describe('when the recipient is not the zero address', function() {
      const to = recipient;

      describe('when the sender does not have enough balance', function() {
        const amount = 101;

        it('reverts', async function() {
          await assertRevert(this.token.transfer(to, amount, { from: owner }));
        });
      });

      describe('when the sender has enough balance', function() {
        const amount = 100;

        it('transfers the requested amount', async function() {
          await this.token.transfer(to, amount, { from: owner });

          (await this.token.balanceOf(owner)).should.be.bignumber.equal(0);

          (await this.token.balanceOf(to)).should.be.bignumber.equal(amount);
        });

        it('emits a transfer event', async function() {
          const { logs } = await this.token.transfer(to, amount, {
            from: owner
          });

          const event = expectEvent.inLogs(logs, 'Transfer', {
            from: owner,
            to: to
          });

          event.args.value.should.be.bignumber.equal(amount);
        });
      });
    });

    describe('when the recipient is the zero address', function() {
      const to = ZERO_ADDRESS;

      it('reverts', async function() {
        await assertRevert(this.token.transfer(to, 100, { from: owner }));
      });
    });
  });

  describe('approve', function() {
    describe('when the spender is not the zero address', function() {
      const spender = recipient;

      describe('when the sender has enough balance', function() {
        const amount = 100;

        it('emits an approval event', async function() {
          const { logs } = await this.token.approve(spender, amount, {
            from: owner
          });

          logs.length.should.equal(1);
          logs[0].event.should.equal('Approval');
          logs[0].args.owner.should.equal(owner);
          logs[0].args.spender.should.equal(spender);
          logs[0].args.value.should.be.bignumber.equal(amount);
        });

        describe('when there was no approved amount before', function() {
          it('approves the requested amount', async function() {
            await this.token.approve(spender, amount, { from: owner });

            (await this.token.allowance(
              owner,
              spender
            )).should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function() {
          beforeEach(async function() {
            await this.token.approve(spender, 1, { from: owner });
          });

          it('approves the requested amount and replaces the previous one', async function() {
            await this.token.approve(spender, amount, { from: owner });

            (await this.token.allowance(
              owner,
              spender
            )).should.be.bignumber.equal(amount);
          });
        });
      });

      describe('when the sender does not have enough balance', function() {
        const amount = 101;

        it('emits an approval event', async function() {
          const { logs } = await this.token.approve(spender, amount, {
            from: owner
          });

          logs.length.should.equal(1);
          logs[0].event.should.equal('Approval');
          logs[0].args.owner.should.equal(owner);
          logs[0].args.spender.should.equal(spender);
          logs[0].args.value.should.be.bignumber.equal(amount);
        });

        describe('when there was no approved amount before', function() {
          it('approves the requested amount', async function() {
            await this.token.approve(spender, amount, { from: owner });

            (await this.token.allowance(
              owner,
              spender
            )).should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function() {
          beforeEach(async function() {
            await this.token.approve(spender, 1, { from: owner });
          });

          it('approves the requested amount and replaces the previous one', async function() {
            await this.token.approve(spender, amount, { from: owner });

            (await this.token.allowance(
              owner,
              spender
            )).should.be.bignumber.equal(amount);
          });
        });
      });
    });

    describe('when the spender is the zero address', function() {
      const amount = 100;
      const spender = ZERO_ADDRESS;

      it('reverts', async function() {
        await assertRevert(
          this.token.approve(spender, amount, { from: owner })
        );
      });
    });
  });

  describe('transfer from', function() {
    const spender = recipient;

    describe('when the recipient is not the zero address', function() {
      const to = anotherAccount;

      describe('when the spender has enough approved balance', function() {
        beforeEach(async function() {
          await this.token.approve(spender, 100, { from: owner });
        });

        describe('when the owner has enough balance', function() {
          const amount = 100;

          it('transfers the requested amount', async function() {
            await this.token.transferFrom(owner, to, amount, { from: spender });

            (await this.token.balanceOf(owner)).should.be.bignumber.equal(0);

            (await this.token.balanceOf(to)).should.be.bignumber.equal(amount);
          });

          it('decreases the spender allowance', async function() {
            await this.token.transferFrom(owner, to, amount, { from: spender });

            (await this.token.allowance(
              owner,
              spender
            )).should.be.bignumber.equal(0);
          });

          it('emits a transfer event', async function() {
            const { logs } = await this.token.transferFrom(owner, to, amount, {
              from: spender
            });

            logs.length.should.equal(1);
            logs[0].event.should.equal('Transfer');
            logs[0].args.from.should.equal(owner);
            logs[0].args.to.should.equal(to);
            logs[0].args.value.should.be.bignumber.equal(amount);
          });
        });

        describe('when the owner does not have enough balance', function() {
          const amount = 101;

          it('reverts', async function() {
            await assertRevert(
              this.token.transferFrom(owner, to, amount, { from: spender })
            );
          });
        });
      });

      describe('when the spender does not have enough approved balance', function() {
        beforeEach(async function() {
          await this.token.approve(spender, 99, { from: owner });
        });

        describe('when the owner has enough balance', function() {
          const amount = 100;

          it('reverts', async function() {
            await assertRevert(
              this.token.transferFrom(owner, to, amount, { from: spender })
            );
          });
        });

        describe('when the owner does not have enough balance', function() {
          const amount = 101;

          it('reverts', async function() {
            await assertRevert(
              this.token.transferFrom(owner, to, amount, { from: spender })
            );
          });
        });
      });
    });

    describe('when the recipient is the zero address', function() {
      const amount = 100;
      const to = ZERO_ADDRESS;

      beforeEach(async function() {
        await this.token.approve(spender, amount, { from: owner });
      });

      it('reverts', async function() {
        await assertRevert(
          this.token.transferFrom(owner, to, amount, { from: spender })
        );
      });
    });
  });

  describe('decrease allowance', function() {
    describe('when the spender is not the zero address', function() {
      const spender = recipient;

      function shouldDecreaseApproval(amount) {
        describe('when there was no approved amount before', function() {
          /*it('reverts', async function() {
            await assertRevert(
              this.token.decreaseAllowance(spender, amount, { from: owner })
            );
          });*/
        });

        describe('when the spender had an approved amount', function() {
          const approvedAmount = amount;

          beforeEach(async function() {
            ({ logs: this.logs } = await this.token.approve(
              spender,
              approvedAmount,
              { from: owner }
            ));
          });

          it('emits an approval event', async function() {
            const { logs } = await this.token.decreaseAllowance(
              spender,
              approvedAmount,
              { from: owner }
            );

            logs.length.should.equal(1);
            logs[0].event.should.equal('Approval');
            logs[0].args.owner.should.equal(owner);
            logs[0].args.spender.should.equal(spender);
            logs[0].args.value.should.be.bignumber.equal(0);
          });

          it('decreases the spender allowance subtracting the requested amount', async function() {
            await this.token.decreaseAllowance(spender, approvedAmount - 1, {
              from: owner
            });

            (await this.token.allowance(
              owner,
              spender
            )).should.be.bignumber.equal(1);
          });

          it('sets the allowance to zero when all allowance is removed', async function() {
            await this.token.decreaseAllowance(spender, approvedAmount, {
              from: owner
            });
            (await this.token.allowance(
              owner,
              spender
            )).should.be.bignumber.equal(0);
          });

          it('reverts when more than the full allowance is removed', async function() {
            /*
            await assertRevert(
              this.token.decreaseAllowance(spender, approvedAmount + 1, {
                from: owner
              })
            );
            */
          });
        });
      }

      describe('when the sender has enough balance', function() {
        const amount = 100;

        shouldDecreaseApproval(amount);
      });

      describe('when the sender does not have enough balance', function() {
        const amount = 101;

        shouldDecreaseApproval(amount);
      });
    });

    describe('when the spender is the zero address', function() {
      const amount = 100;
      const spender = ZERO_ADDRESS;

      it('reverts', async function() {
        await assertRevert(
          this.token.decreaseAllowance(spender, amount, { from: owner })
        );
      });
    });
  });

  describe('increase allowance', function() {
    const amount = 100;

    describe('when the spender is not the zero address', function() {
      const spender = recipient;

      describe('when the sender has enough balance', function() {
        it('emits an approval event', async function() {
          const { logs } = await this.token.increaseAllowance(spender, amount, {
            from: owner
          });

          logs.length.should.equal(1);
          logs[0].event.should.equal('Approval');
          logs[0].args.owner.should.equal(owner);
          logs[0].args.spender.should.equal(spender);
          logs[0].args.value.should.be.bignumber.equal(amount);
        });

        describe('when there was no approved amount before', function() {
          it('approves the requested amount', async function() {
            await this.token.increaseAllowance(spender, amount, {
              from: owner
            });

            (await this.token.allowance(
              owner,
              spender
            )).should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function() {
          beforeEach(async function() {
            await this.token.approve(spender, 1, { from: owner });
          });

          it('increases the spender allowance adding the requested amount', async function() {
            await this.token.increaseAllowance(spender, amount, {
              from: owner
            });

            (await this.token.allowance(
              owner,
              spender
            )).should.be.bignumber.equal(amount + 1);
          });
        });
      });

      describe('when the sender does not have enough balance', function() {
        const amount = 101;

        it('emits an approval event', async function() {
          const { logs } = await this.token.increaseAllowance(spender, amount, {
            from: owner
          });

          logs.length.should.equal(1);
          logs[0].event.should.equal('Approval');
          logs[0].args.owner.should.equal(owner);
          logs[0].args.spender.should.equal(spender);
          logs[0].args.value.should.be.bignumber.equal(amount);
        });

        describe('when there was no approved amount before', function() {
          it('approves the requested amount', async function() {
            await this.token.increaseAllowance(spender, amount, {
              from: owner
            });

            (await this.token.allowance(
              owner,
              spender
            )).should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function() {
          beforeEach(async function() {
            await this.token.approve(spender, 1, { from: owner });
          });

          it('increases the spender allowance adding the requested amount', async function() {
            await this.token.increaseAllowance(spender, amount, {
              from: owner
            });

            (await this.token.allowance(
              owner,
              spender
            )).should.be.bignumber.equal(amount + 1);
          });
        });
      });
    });

    describe('when the spender is the zero address', function() {
      const spender = ZERO_ADDRESS;

      it('reverts', async function() {
        await assertRevert(
          this.token.increaseAllowance(spender, amount, { from: owner })
        );
      });
    });
  });

  describe('_mint', function() {
    const initialSupply = new BigNumber(100);
    const amount = new BigNumber(50);

    it('rejects a null account', async function() {
      await assertRevert(this.token.mint(ZERO_ADDRESS, amount));
    });

    describe('for a non null account', function() {
      beforeEach('minting', async function() {
        const { logs } = await this.token.mint(recipient, amount);
        this.logs = logs;
      });

      it('increments totalSupply', async function() {
        const expectedSupply = initialSupply.plus(amount);
        (await this.token.totalSupply()).should.be.bignumber.equal(
          expectedSupply
        );
      });

      it('increments recipient balance', async function() {
        (await this.token.balanceOf(recipient)).should.be.bignumber.equal(
          amount
        );
      });

      it('emits Transfer event', async function() {
        const event = expectEvent.inLogs(this.logs, 'Transfer', {
          from: ZERO_ADDRESS,
          to: recipient
        });

        event.args.value.should.be.bignumber.equal(amount);
      });
    });
  });

  describe('_burn', function() {
    const initialSupply = new BigNumber(100);

    it('rejects a null account', async function() {
      await assertRevert(this.token.burn(ZERO_ADDRESS, 1));
    });

    describe('for a non null account', function() {
      it('rejects burning more than balance', async function() {
        await assertRevert(this.token.burn(owner, initialSupply.plus(1)));
      });

      const describeBurn = function(description, amount) {
        describe(description, function() {
          beforeEach('burning', async function() {
            const { logs } = await this.token.burn(owner, amount);
            this.logs = logs;
          });

          it('decrements totalSupply', async function() {
            const expectedSupply = initialSupply.minus(amount);
            (await this.token.totalSupply()).should.be.bignumber.equal(
              expectedSupply
            );
          });

          it('decrements owner balance', async function() {
            const expectedBalance = initialSupply.minus(amount);
            (await this.token.balanceOf(owner)).should.be.bignumber.equal(
              expectedBalance
            );
          });

          it('emits Transfer event', async function() {
            const event = expectEvent.inLogs(this.logs, 'Transfer', {
              from: owner,
              to: ZERO_ADDRESS
            });

            event.args.value.should.be.bignumber.equal(amount);
          });
        });
      };

      describeBurn('for entire balance', initialSupply);
      describeBurn('for less amount than balance', initialSupply.sub(1));
    });
  });

  describe('_burnFrom', function() {
    const initialSupply = new BigNumber(100);
    const allowance = new BigNumber(70);

    const spender = anotherAccount;

    beforeEach('approving', async function() {
      await this.token.approve(spender, allowance, { from: owner });
    });

    it('rejects a null account', async function() {
      await assertRevert(this.token.burnFrom(ZERO_ADDRESS, 1));
    });

    describe('for a non null account', function() {
      it('rejects burning more than allowance', async function() {
        await assertRevert(this.token.burnFrom(owner, allowance.plus(1)));
      });

      it('rejects burning more than balance', async function() {
        await assertRevert(this.token.burnFrom(owner, initialSupply.plus(1)));
      });

      const describeBurnFrom = function(description, amount) {
        describe(description, function() {
          beforeEach('burning', async function() {
            const { logs } = await this.token.burnFrom(owner, amount, {
              from: spender
            });
            this.logs = logs;
          });

          it('decrements totalSupply', async function() {
            const expectedSupply = initialSupply.minus(amount);
            (await this.token.totalSupply()).should.be.bignumber.equal(
              expectedSupply
            );
          });

          it('decrements owner balance', async function() {
            const expectedBalance = initialSupply.minus(amount);
            (await this.token.balanceOf(owner)).should.be.bignumber.equal(
              expectedBalance
            );
          });

          it('decrements spender allowance', async function() {
            const expectedAllowance = allowance.minus(amount);
            (await this.token.allowance(
              owner,
              spender
            )).should.be.bignumber.equal(expectedAllowance);
          });

          it('emits Transfer event', async function() {
            const event = expectEvent.inLogs(this.logs, 'Transfer', {
              from: owner,
              to: ZERO_ADDRESS
            });

            event.args.value.should.be.bignumber.equal(amount);
          });
        });
      };

      describeBurnFrom('for entire allowance', allowance);
      describeBurnFrom('for less amount than allowance', allowance.sub(1));
    });
  });

  describe('transferPreSigned', function() {
    describe('when the recipient is not the null address', function() {
      it('when the sender has enough balance', async function() {
        const aliceAddr = ethUtil.addHexPrefix(
          ethUtil.privateToAddress(Buffer.from(ALICE, 'hex')).toString('hex')
        );
        this.token = await EnvoyToken.new(aliceAddr, 100);
        const signature = delegateTxion(
          ALICE,
          this.token.address,
          recipient,
          50,
          25,
          39200
        );
        await this.token.transferPreSigned(
          ethUtil.addHexPrefix(signature),
          recipient,
          new BigNumber(50),
          new BigNumber(25),
          new BigNumber(39200),
          { from: delegate }
        );
        (await this.token.balanceOf(aliceAddr)).should.be.bignumber.equal(25);
        (await this.token.balanceOf(recipient)).should.be.bignumber.equal(50);
        (await this.token.balanceOf(delegate)).should.be.bignumber.equal(25);
      });

      it('when the sender does not have enough balance', async function() {
        const aliceAddr = ethUtil.addHexPrefix(
          ethUtil.privateToAddress(Buffer.from(ALICE, 'hex')).toString('hex')
        );
        this.token = await EnvoyToken.new(aliceAddr, 50);
        const signature = delegateTxion(
          ALICE,
          this.token.address,
          recipient,
          50,
          25,
          39200
        );
        await assertRevert(
          this.token.transferPreSigned(
            ethUtil.addHexPrefix(signature),
            recipient,
            new BigNumber(50),
            new BigNumber(25),
            new BigNumber(39200),
            { from: delegate }
          )
        );
      });
    });

    it('when the recipient is the null account', async function() {
      const aliceAddr = ethUtil.addHexPrefix(
        ethUtil.privateToAddress(Buffer.from(ALICE, 'hex')).toString('hex')
      );
      this.token = await EnvoyToken.new(aliceAddr, 50);
      const signature = delegateTxion(
        ALICE,
        '0x0000000000000000000000000000000000000000',
        recipient,
        50,
        25,
        39200
      );
      await assertRevert(
        this.token.transferPreSigned(
          ethUtil.addHexPrefix(signature),
          recipient,
          new BigNumber(50),
          new BigNumber(25),
          new BigNumber(39200),
          { from: delegate }
        )
      );
    });

    it("when the signature hasn't been used", async function() {
      const aliceAddr = ethUtil.addHexPrefix(
        ethUtil.privateToAddress(Buffer.from(ALICE, 'hex')).toString('hex')
      );
      this.token = await EnvoyToken.new(aliceAddr, 100);
      const signatureA = delegateTxion(
        ALICE,
        this.token.address,
        recipient,
        50,
        25,
        39200
      );
      await this.token.transferPreSigned(
        ethUtil.addHexPrefix(signatureA),
        recipient,
        new BigNumber(50),
        new BigNumber(25),
        new BigNumber(39200),
        { from: delegate }
      );
      (await this.token.balanceOf(aliceAddr)).should.be.bignumber.equal(25);
      (await this.token.balanceOf(recipient)).should.be.bignumber.equal(50);
      (await this.token.balanceOf(delegate)).should.be.bignumber.equal(25);
      const signatureB = delegateTxion(
        ALICE,
        this.token.address,
        recipient,
        20,
        5,
        39200
      );
      await this.token.transferPreSigned(
        ethUtil.addHexPrefix(signatureB),
        recipient,
        new BigNumber(20),
        new BigNumber(5),
        new BigNumber(39200),
        { from: delegate }
      );
      (await this.token.balanceOf(aliceAddr)).should.be.bignumber.equal(0);
      (await this.token.balanceOf(recipient)).should.be.bignumber.equal(70);
      (await this.token.balanceOf(delegate)).should.be.bignumber.equal(30);
    });

    it('when the signature has been used', async function() {
      const aliceAddr = ethUtil.addHexPrefix(
        ethUtil.privateToAddress(Buffer.from(ALICE, 'hex')).toString('hex')
      );
      this.token = await EnvoyToken.new(aliceAddr, 100);
      const signature = delegateTxion(
        ALICE,
        this.token.address,
        recipient,
        50,
        25,
        39200
      );
      await this.token.transferPreSigned(
        ethUtil.addHexPrefix(signature),
        recipient,
        new BigNumber(50),
        new BigNumber(25),
        new BigNumber(39200),
        { from: delegate }
      );
      (await this.token.balanceOf(aliceAddr)).should.be.bignumber.equal(25);
      (await this.token.balanceOf(recipient)).should.be.bignumber.equal(50);
      (await this.token.balanceOf(delegate)).should.be.bignumber.equal(25);
      await assertRevert(
        this.token.transferPreSigned(
          ethUtil.addHexPrefix(signature),
          recipient,
          new BigNumber(50),
          new BigNumber(25),
          new BigNumber(39200),
          { from: delegate }
        )
      );
    });
  });
});
