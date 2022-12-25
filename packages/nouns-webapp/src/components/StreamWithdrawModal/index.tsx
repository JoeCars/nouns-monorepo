import React, { useEffect, useState } from 'react';
import classes from './StreamWidthdrawModal.module.css';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Trans } from '@lingui/macro';
import ModalTitle from '../ModalTitle';
import config from '../../config';
import { contract2humanUSDCFormat, human2ContractUSDCFormat } from '../../utils/usdcUtils';
import { BigNumber, ethers, utils } from 'ethers';
import { useEthers } from '@usedapp/core/dist/cjs/src';
import {
  useStreamRatePerSecond,
  useStreamRemaningBalance,
  useWithdrawTokens,
} from '../../wrappers/nounsStream';
import ModalBottomButtonRow from '../ModalBottomButtonRow';
import BrandSpinner from '../BrandSpinner';
import BrandNumericEntry from '../BrandNumericEntry';
import SolidColorBackgroundModal from '../SolidColorBackgroundModal';
import StartOrEndTime from '../StartOrEndTime';
import { currentUnixEpoch } from '../../utils/timeUtils';
import { formatTokenAmmount } from '../../utils/streamingPaymentUtils/streamingPaymentUtils';
import { SupportedCurrency } from '../ProposalActionsModal/steps/TransferFundsDetailsStep';

dayjs.extend(relativeTime);

export const Backdrop: React.FC<{ onDismiss: () => void }> = props => {
  return <div className={classes.backdrop} onClick={props.onDismiss} />;
};

const StreamWidthdrawModalOverlay: React.FC<{
  onDismiss: () => void;
  streamAddress?: string;
  endTime?: number;
  startTime?: number;
  streamAmount?: number;
  tokenAddress?: string;
}> = props => {
  const {
    onDismiss,
    streamAddress = '',
    streamAmount = 0,
    endTime = 0,
    startTime = 0,
    tokenAddress = '',
  } = props;

  const isUSDC = tokenAddress.toLowerCase() === config.addresses.usdcToken?.toLowerCase();
  const unitForDisplay = isUSDC ? 'USDC' : 'WETH';
  const { account } = useEthers();

  const withdrawableBalance = useStreamRemaningBalance(streamAddress ?? '', account ?? '');
  const { widthdrawTokens, widthdrawTokensState } = useWithdrawTokens(streamAddress ?? '');
  const [widthdrawAmount, setWidthdrawAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const streamRatePerSecond = useStreamRatePerSecond(streamAddress ?? '', 1_000_000) ?? 0;

  const [streamedSoFar, setStreamedSoFar] = useState<BigNumber | string | null>(null);
  useEffect(() => {
    setTimeout(() => {
      if (currentUnixEpoch() > endTime) {
        setStreamedSoFar(streamAmount.toString());
        return;
      }

      setStreamedSoFar(
        streamRatePerSecond && Math.floor(Date.now() / 1000) - startTime > 0
          ? streamRatePerSecond
              .mul(BigNumber.from(Math.floor(Date.now() / 1000) - startTime))
              .toString()
          : BigNumber.from(0),
      );
    }, 1000);
  }, [endTime, startTime, streamAmount, streamRatePerSecond, streamedSoFar]);

  if (!withdrawableBalance || isLoading || streamedSoFar === null) {
    return (
      <>
        <ModalTitle>
          <Trans>Withdraw from Stream</Trans>
        </ModalTitle>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {(widthdrawTokensState.status === 'Mining' ||
            !withdrawableBalance ||
            widthdrawTokensState.status === 'PendingSignature') && <BrandSpinner />}
          {widthdrawTokensState.status === 'Success' && (
            <div className={classes.transactionStatus}>
              <p>
                <Trans>
                  You've successfully withdrawn {widthdrawAmount} {unitForDisplay} to your wallet
                </Trans>
              </p>
            </div>
          )}
          {(widthdrawTokensState.status === 'Exception' ||
            widthdrawTokensState.status === 'Fail') && (
            <div className={classes.transactionStatus}>
              <p className={classes.voteFailureTitle}>
                <Trans>There was an error withdrawing to your wallet.</Trans>
              </p>
              <div className={classes.voteFailureBody}>
                Error:{' '}
                <span className={classes.voteFailureErrorMessage}>
                  {widthdrawTokensState.errorMessage}
                </span>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  const humanUnitsStreamRemaningBalance = parseFloat(
    isUSDC
      ? contract2humanUSDCFormat(withdrawableBalance?.toString() ?? '')
      : ethers.utils.formatUnits(withdrawableBalance?.toString() ?? '').toString(),
  );

  return (
    <>
      <ModalTitle>
        <Trans>Withdraw from Stream</Trans>
      </ModalTitle>

      <span
        style={{
          opacity: '0.5',
          fontWeight: 'bold',
        }}
      >
        Avilable to withdraw
      </span>
      <h1
        style={{
          fontWeight: 'bold',
        }}
      >
        {isUSDC
          ? contract2humanUSDCFormat(withdrawableBalance?.toString() ?? '')
          : ethers.utils.formatUnits(withdrawableBalance?.toString() ?? '').toString()}{' '}
        {unitForDisplay}
      </h1>

      <span
        style={{
          opacity: '0.5',
          fontWeight: 'bold',
        }}
      >
        Streamed so far
      </span>
      <h1
        style={{
          fontWeight: 'bold',
        }}
      >
        {isUSDC
          ? parseFloat(contract2humanUSDCFormat(streamedSoFar?.toString() ?? '')).toFixed(2)
          : parseFloat(ethers.utils.formatUnits(streamedSoFar).toString()).toFixed(2)}{' '}
        {unitForDisplay}
      </h1>

      <span
        style={{
          opacity: '0.5',
          fontWeight: 'bold',
        }}
      >
        Total stream value
      </span>
      <h1
        style={{
          fontWeight: 'bold',
        }}
      >
        {isUSDC
          ? contract2humanUSDCFormat(streamAmount)
          : ethers.utils.formatUnits(streamAmount.toString()).toString()}{' '}
        {unitForDisplay}
      </h1>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <BrandNumericEntry
          label={'Widthdraw amount'}
          value={widthdrawAmount}
          onValueChange={e => {
            console.log(e);
            setWidthdrawAmount(e.floatValue ?? 0);
          }}
          placeholder={isUSDC ? '0 USDC' : '0 WETH'}
          isInvalid={widthdrawAmount > humanUnitsStreamRemaningBalance}
        />
        {/* Hover brightness */}
        <div
          style={{
            position: 'absolute',
            right: '40px',
            top: '68%',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
          onClick={() =>
            setWidthdrawAmount(
              parseFloat(
                isUSDC
                  ? contract2humanUSDCFormat(withdrawableBalance?.toString() ?? '')
                  : ethers.utils.formatUnits(withdrawableBalance?.toString() ?? '').toString(),
              ),
            )
          }
        >
          Max
        </div>
      </div>

      <ModalBottomButtonRow
        prevBtnText={<Trans>Cancel</Trans>}
        onPrevBtnClick={onDismiss}
        nextBtnText={<Trans>Widthdraw</Trans>}
        onNextBtnClick={async () => {
          setIsLoading(true);
          console.log(
            formatTokenAmmount(
              widthdrawAmount.toString(),
              isUSDC ? SupportedCurrency.USDC : SupportedCurrency.WETH,
            ),
          );
          widthdrawTokens(
            formatTokenAmmount(
              widthdrawAmount.toString(),
              isUSDC ? SupportedCurrency.USDC : SupportedCurrency.WETH,
            ),
          );
        }}
        isNextBtnDisabled={withdrawableBalance && humanUnitsStreamRemaningBalance === 0}
      />
      <div
        style={{
          opacity: '0.5',
          fontWeight: 'bold',
          marginBottom: '1rem',
          marginTop: '1rem',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        Stream <StartOrEndTime startTime={startTime} endTime={endTime} />
      </div>
    </>
  );
};

const StreamWidthdrawModal: React.FC<{
  show: boolean;
  onDismiss: () => void;
  streamAddress?: string;
  startTime?: number;
  endTime?: number;
  streamAmount?: number;
  tokenAddress?: string;
}> = props => {
  const { onDismiss, show } = props;
  return (
    <>
      <SolidColorBackgroundModal
        show={show}
        onDismiss={onDismiss}
        content={<StreamWidthdrawModalOverlay {...props} />}
      />
    </>
  );
};

export default StreamWidthdrawModal;