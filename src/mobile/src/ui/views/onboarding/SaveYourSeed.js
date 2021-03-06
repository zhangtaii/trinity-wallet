import each from 'lodash/each';
import React, { Component } from 'react';
import { translate, Trans } from 'react-i18next';
import { StyleSheet, View, Text, BackHandler, Clipboard, NativeModules } from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import RNPrint from 'react-native-print';
import RNSecureClipboard from 'react-native-secure-clipboard';
import { getChecksum } from 'shared-modules/libs/iota/utils';
import { generateAlert } from 'shared-modules/actions/alerts';
import { paperWalletFilled } from 'shared-modules/images/PaperWallets.js';
import { setSeedShareTutorialVisitationStatus } from 'shared-modules/actions/settings';
import Modal from 'react-native-modal';
import timer from 'react-native-timer';
import QRCode from 'qr.js/lib/QRCode';
import PrintModal from 'ui/components/PrintModal';
import PasswordManagerModalContent from 'ui/components/PasswordManagerModal';
import Button from 'ui/components/Button';
import OnboardingButtons from 'ui/components/OnboardingButtons';
import StatefulDropdownAlert from 'ui/components/StatefulDropdownAlert';
import DynamicStatusBar from 'ui/components/DynamicStatusBar';
import GENERAL from 'ui/theme/general';
import { width, height } from 'libs/dimensions';
import Header from 'ui/components/Header';
import { leaveNavigationBreadcrumb } from 'libs/bugsnag';
import { isAndroid, isIPhone11 } from 'libs/device';
import { Icon } from 'ui/theme/icons';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: height / 16,
    },
    midContainer: {
        flex: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomContainer: {
        flex: 0.5,
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    infoText: {
        fontFamily: 'SourceSansPro-Regular',
        fontSize: GENERAL.fontSize4,
        backgroundColor: 'transparent',
        paddingHorizontal: width / 9,
        textAlign: 'center',
    },
    infoTextNormal: {
        fontFamily: 'SourceSansPro-Regular',
        fontSize: GENERAL.fontSize4,
        backgroundColor: 'transparent',
        textAlign: 'center',
    },
    infoTextBold: {
        fontFamily: 'SourceSansPro-Bold',
        fontSize: GENERAL.fontSize4,
        backgroundColor: 'transparent',
        textAlign: 'center',
    },
    infoTextSmall: {
        fontFamily: 'SourceSansPro-Regular',
        fontSize: GENERAL.fontSize3,
        backgroundColor: 'transparent',
        textAlign: 'center',
    },
    line: {
        borderLeftWidth: 0.5,
        width: 1,
        height: height / 40,
        marginVertical: height / 150,
    },
    modal: {
        height,
        width,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
    },
});

/** Save Your Seed component */
class SaveYourSeed extends Component {
    static propTypes = {
        /** Navigation object */
        navigator: PropTypes.object.isRequired,
        /** @ignore */
        onboardingComplete: PropTypes.bool.isRequired,
        /** @ignore */
        theme: PropTypes.object.isRequired,
        /** @ignore */
        t: PropTypes.func.isRequired,
        /** @ignore */
        seed: PropTypes.string.isRequired,
        /** @ignore */
        setSeedShareTutorialVisitationStatus: PropTypes.func.isRequired,
        /** @ignore */
        hasVisitedSeedShareTutorial: PropTypes.bool.isRequired,
        /** @ignore */
        generateAlert: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            isModalActive: false,
        };
        this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
    }

    componentDidMount() {
        leaveNavigationBreadcrumb('SaveYourSeed');
        if (this.props.onboardingComplete) {
            BackHandler.addEventListener('saveYourSeedBackPress', () => {
                this.onBackPress();
                return true;
            });
        }
    }

    componentWillUnmount() {
        if (this.props.onboardingComplete) {
            BackHandler.removeEventListener('saveYourSeedBackPress');
        }
        timer.clearTimeout('delayPrint');
        timer.clearTimeout('clipboardClear');
        timer.clearTimeout('delayAlert');
        this.clearClipboard();
    }

    /**
     * Hide navigation bar when returning from print
     * @method onNavigatorEvent
     */
    onNavigatorEvent(event) {
        if (event.id === 'willAppear') {
            this.props.navigator.toggleNavBar({
                to: 'hidden',
            });
        }
    }

    /**
     * Navigates to save seed confirmation screen
     * @method onDonePress
     */
    onDonePress() {
        const { theme: { body } } = this.props;
        this.props.navigator.push({
            screen: 'saveSeedConfirmation',
            navigatorStyle: {
                navBarHidden: true,
                navBarTransparent: true,
                topBarElevationShadowEnabled: false,
                screenBackgroundColor: body.bg,
                drawUnderStatusBar: true,
                statusBarColor: body.bg,
            },
            animated: false,
        });
        this.clearClipboard();
    }

    /**
     * Pops the active screen from the navigation stack
     * @method onBackPress
     */
    onBackPress() {
        const { theme: { body } } = this.props;
        this.props.navigator.pop({
            navigatorStyle: {
                navBarHidden: true,
                navBarTransparent: true,
                topBarElevationShadowEnabled: false,
                screenBackgroundColor: body.bg,
                drawUnderStatusBar: true,
                statusBarColor: body.bg,
            },
            animated: false,
        });
    }

    /**
     * Navigates to write seed down screen
     * @method onWriteSeedDownPress
     */
    onWriteSeedDownPress() {
        const { theme: { body } } = this.props;
        this.props.navigator.push({
            screen: 'writeSeedDown',
            navigatorStyle: {
                navBarHidden: true,
                navBarTransparent: true,
                topBarElevationShadowEnabled: false,
                screenBackgroundColor: body.bg,
                drawUnderStatusBar: true,
                statusBarColor: body.bg,
                navBarButtonColor: isAndroid ? body.bg : 'black',
            },
            animated: false,
        });
    }

    /**
     * Shows modal
     * @method onPrintPaperWalletPress
     */
    onPrintPaperWalletPress() {
        this.openModal('printModal');
    }

    onExportSeedVaultPress() {
        const { theme: { body } } = this.props;
        this.props.navigator.push({
            screen: 'seedVaultBackup',
            navigatorStyle: {
                navBarHidden: true,
                navBarTransparent: true,
                topBarElevationShadowEnabled: false,
                screenBackgroundColor: body.bg,
                drawUnderStatusBar: true,
                statusBarColor: body.bg,
                navBarButtonColor: body.bg,
            },
            animated: false,
        });
    }

    /**
     * Generates html for seed qr
     * @method getQrHTMLString
     */
    getQrHTMLString(seed) {
        const qr = new QRCode(-1, 1);
        each(seed, (char) => {
            qr.addData(char);
        });
        qr.make();
        const cells = qr.modules;

        let qrString = '';
        cells.forEach((row, rowIndex) => {
            row.forEach((cell, cellIndex) => {
                qrString += `<rect
                        height="1.6"
                        key="${cellIndex}"
                        style="fill: ${cell ? '#000000' : 'none'}"
                        width="1.6"
                        x="${161 + cellIndex * 1.6}"
                        y="${699 + rowIndex * 1.6}"
                    />`;
            });
        });
        return qrString;
    }

    /**
     * Constructs html text components for all seed characters
     * @method getSeedHTMLString
     */
    getSeedHTMLString(seed) {
        let seedChars = '';
        for (let i = 0; i < seed.length; i++) {
            const space = i % 9 > 5 ? 38 : i % 9 > 2 ? 19 : 0;
            const x = 193 + (i % 9) * 26 + space;
            const y = 365 + Math.floor(i / 9) * 32.8;
            const currentChar = `<text transform="matrix(1 0 0 1 ${x} ${y})" font-size="16">
                    ${seed.charAt(i)}
                </text>`;
            seedChars = seedChars + currentChar;
        }
        return seedChars;
    }

    /**
     * Constructs paper wallet html string for printing
     * @method getHTMLContent
     */
    getHTMLContent() {
        const { seed } = this.props;
        const checksumString = `<text x="372.7" y="735">${getChecksum(seed)}</text>`;
        const qrString = this.getQrHTMLString(seed);
        const seedString = this.getSeedHTMLString(seed);

        return (
            '<svg viewBox="0 0 595 841" xmlns="http://www.w3.org/2000/svg">' +
            seedString +
            qrString +
            checksumString +
            '</svg>'
        );
    }

    /**
     * iOS: Alerts the user that the clipboard was cleared
     * @method clearClipboard
     */
    clearClipboard() {
        const { t } = this.props;
        if (this.state.copyPressed) {
            Clipboard.setString(' ');
            timer.setTimeout(
                'clipboardClear',
                () =>
                    this.props.generateAlert(
                        'info',
                        t('copyToClipboard:seedCleared'),
                        t('copyToClipboard:seedClearedExplanation'),
                    ),
                500,
            );
            this.setState({ copyPressed: false });
        }
    }

    /**
     *  Triggers paper wallet print
     *  @method print
     */
    async print() {
        this.hideModal();
        const paperWalletHTML = `
        <!DOCTYPE html>
        <html>
          <head>
             <meta charset="utf-8">
          </head>
          <style>
             html,
             body,
             #wallet {
                padding: 0px;
                margin: 0px;
                text-align: center;
                overflow: hidden;
                height: ${isAndroid ? '100vh' : null};
                width: ${isAndroid ? '100vw' : null};
             }
             svg {
                height: ${isAndroid ? '100vh' : '120vh'};
                width: ${isAndroid ? '100vw' : '120vw'};
                position: absolute;
                top: 0;
                left: 0;
             }
             text {
               font-size: 20px;
               fill: #231f20;
               font-family: Monospace;
             }
             @font-face { font-family: "Monospace"; src: "shared-modules/custom-fonts/SourceCodePro-Medium.ttf"
          </style>
          <body>
            ${this.getHTMLContent()}
            ${paperWalletFilled}
          </body>
        </html>`;
        try {
            // Delay print to allow for modal close animation
            timer.setTimeout(
                'delayPrint',
                () => {
                    this.props.navigator.toggleNavBar({
                        to: 'shown',
                    });
                    RNPrint.print({ html: paperWalletHTML });
                },
                500,
            );
        } catch (err) {
            console.error(err); // eslint-disable-line no-console
        }
    }

    /**
     * iOS: Copies seed to the clipboard and clears after 60 seconds
     * Android: Passes seed to Keepass share intent
     * @method copy
     */
    copy() {
        const { t, seed } = this.props;
        if (isAndroid) {
            timer.setTimeout(
                'delayShare',
                () => {
                    this.hideModal();
                    NativeModules.ShareSecure.share('keepass', {
                        title: t('shareSeed'),
                        message: seed,
                    }).catch(() =>
                        this.props.generateAlert('error', t('noPasswordManagers'), t('noPasswordManagersExplanation')),
                    );
                },
                500,
            );
        } else {
            this.hideModal();
            // Delay copy to allow for modal close animation
            timer.setTimeout(
                'delayCopy',
                () => {
                    RNSecureClipboard.setString(seed);
                    this.props.generateAlert(
                        'success',
                        t('copyToClipboard:seedCopied'),
                        t('copyToClipboard:seedCopiedExplanation'),
                    );
                    this.setState({ copyPressed: true });
                },
                500,
            );
            timer.setTimeout(
                'clipboardClear',
                () => {
                    this.clearClipboard();
                    this.setState({ copyPressed: false });
                },
                60500,
            );
        }
    }

    openModal(modalContent) {
        this.setState({ modalContent, isModalActive: true });
    }

    hideModal() {
        this.setState({ isModalActive: false });
    }

    renderModalContent = () => {
        const { theme, hasVisitedSeedShareTutorial } = this.props;
        let content = '';
        switch (this.state.modalContent) {
            case 'printModal':
                content = <PrintModal theme={theme} print={() => this.print()} hideModal={() => this.hideModal()} />;
                break;
            case 'passwordManagerModal':
                content = (
                    <PasswordManagerModalContent
                        theme={theme}
                        hideModal={() => this.hideModal()}
                        hasVisitedSeedShareTutorial={hasVisitedSeedShareTutorial}
                        setSeedShareTutorialVisitationStatus={this.props.setSeedShareTutorialVisitationStatus}
                        copy={() => this.copy()}
                    />
                );
                break;
        }
        return content;
    };

    render() {
        const { t, theme: { body, secondary } } = this.props;
        const { isModalActive } = this.state;
        const textColor = { color: body.color };
        const lineColor = { borderLeftColor: body.color };

        return (
            <View style={[styles.container, { backgroundColor: body.bg }]}>
                <DynamicStatusBar backgroundColor={body.bg} />
                <View style={styles.topContainer}>
                    <Icon name="iota" size={width / 8} color={body.color} />
                    <View style={{ flex: 0.7 }} />
                    <Header textColor={body.color}>{t('saveYourSeed')}</Header>
                </View>
                <View style={styles.midContainer}>
                    <Trans i18nKey="saveYourSeed:mustSaveYourSeed">
                        <Text style={[styles.infoText, textColor]}>
                            <Text style={styles.infoTextNormal}>You must save your seed with </Text>
                            <Text style={styles.infoTextBold}>at least one</Text>
                            <Text style={styles.infoTextNormal}> of the options listed below.</Text>
                        </Text>
                    </Trans>
                    <View style={{ flex: 0.5 }} />
                    <Text style={[styles.infoTextSmall, textColor]}>{t('mostSecure')}</Text>
                    <View style={[styles.line, lineColor]} />
                    {!isIPhone11 && (
                        <Button
                            onPress={() => this.onExportSeedVaultPress()}
                            style={{
                                wrapper: {
                                    width: width / 1.36,
                                    height: height / 13,
                                    borderRadius: height / 90,
                                    backgroundColor: secondary.color,
                                },
                                children: {
                                    color: secondary.body,
                                },
                            }}
                        >
                            {t('seedVault:exportSeedVault')}
                        </Button>
                    )}
                    {!isIPhone11 && <View style={[styles.line, lineColor]} />}
                    <Button
                        onPress={() => this.onWriteSeedDownPress()}
                        style={{
                            wrapper: {
                                width: width / 1.36,
                                height: height / 13,
                                borderRadius: height / 90,
                                backgroundColor: secondary.color,
                            },
                            children: {
                                color: secondary.body,
                            },
                        }}
                    >
                        {t('saveYourSeed:writeYourSeedDown')}
                    </Button>
                    <View style={[styles.line, lineColor]} />
                    {/* FIXME Temporarily disable paper wallet on Android */}
                    {!isAndroid && (
                        <View style={{ alignItems: 'center' }}>
                            <Button
                                onPress={() => this.onPrintPaperWalletPress()}
                                style={{
                                    wrapper: {
                                        width: width / 1.36,
                                        height: height / 13,
                                        borderRadius: height / 90,
                                        backgroundColor: secondary.color,
                                    },
                                    children: {
                                        color: secondary.body,
                                    },
                                }}
                            >
                                {t('global:paperWallet')}
                            </Button>
                            <View style={[styles.line, lineColor]} />
                        </View>
                    )}
                    <Text style={[styles.infoTextSmall, textColor]}>{t('leastSecure')}</Text>
                    <View style={{ flex: 1 }} />
                </View>
                <View style={styles.bottomContainer}>
                    <OnboardingButtons
                        onLeftButtonPress={() => this.onBackPress()}
                        onRightButtonPress={() => this.onDonePress()}
                        leftButtonText={t('global:goBack')}
                        rightButtonText={t('iHavesavedMySeed')}
                    />
                </View>
                <StatefulDropdownAlert backgroundColor={body.bg} />
                <Modal
                    backdropTransitionInTiming={isAndroid ? 500 : 300}
                    backdropTransitionOutTiming={200}
                    backdropColor={body.bg}
                    backdropOpacity={0.9}
                    style={styles.modal}
                    isVisible={isModalActive}
                    onBackButtonPress={() => this.hideModal()}
                    hideModalContentWhileAnimating
                    useNativeDriver={isAndroid}
                >
                    {this.renderModalContent()}
                </Modal>
            </View>
        );
    }
}

const mapStateToProps = (state) => ({
    theme: state.settings.theme,
    onboardingComplete: state.accounts.onboardingComplete,
    seed: state.wallet.seed,
    hasVisitedSeedShareTutorial: state.settings.hasVisitedSeedShareTutorial,
});

const mapDispatchToProps = {
    setSeedShareTutorialVisitationStatus,
    generateAlert,
};

export default translate(['saveYourSeed', 'global'])(connect(mapStateToProps, mapDispatchToProps)(SaveYourSeed));
