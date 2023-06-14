import React, { useEffect, useState } from 'react';
import Breadcrumbs from '../../components/Breadcrumbs';
import { Button, Collapse, Form, Input, Statistic } from 'antd';
import styles from '../../styles/modules/pages/bonusnaya-programma/bonusnaya-programma.module.scss';
import { useInputPhone } from '../../hooks/useInputPhone';
import { API } from '../../http';
import { ApiUrl } from '../../types/ApiUrl';
import NotificationAlert from '../../components/Notification';
import { GetServerSideProps } from 'next';
import { wrapper } from '../../redux/store';
import { fetchUser } from '../../redux/actions-creators/auth';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { getCookie, setCookie } from 'cookies-next';
import Link from 'next/link';
import { useInputCode } from '../../hooks/useInputCode';
import MetaLayout from '../../layouts/MetaLayout';
import { declOfNumBonuses } from '../../helpers/declOfNumBonuses';

interface IBonusData {
  isRegistered: boolean;
  bonusCount?: number;
}

interface IBonuses {
  data: IBonusData;
}

const Bonuses: React.FC<IBonuses> = ({ data }) => {
  const { Panel } = Collapse;
  const { user } = useTypedSelector((state) => state.auth);

  const handleAnimation = (e: any) => {
    const ico = e.target.closest('.bonus').querySelector('.ico-plus');
    ico.classList.toggle('ico-plus-active');
  };
  const phoneInput = useInputPhone('');
  const code = useInputCode('');

  const [loading, setLoading] = useState<boolean>(false);
  const [checkBonuses, setCheckBonuses] = useState<boolean>(data.isRegistered);
  const [confirmPhone, setConfirmPhone] = useState<boolean>(false);
  const [quantity, setQuantity] = useState(
    data.isRegistered ? data.bonusCount : 0
  );
  const [disabled, setDisabled] = useState<boolean>(false);
  const [reFetch, setReFetch] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);

  const { Countdown } = Statistic;

  useEffect(() => {
    if (user?.phone) {
      phoneInput.setValue(phoneInput.formattedValue(user?.phone));
    } else {
      phoneInput.setValue('');
    }
  }, [user]);

  const onFinish = async () => {
    try {
      let phone = phoneInput.value.replace(/\D/g, '');
      if (phone[0] === '8') {
        phone = phone.replace('8', '7');
      }
      setLoading(true);
      const response = await API().api(`${ApiUrl.CHECK_BONUSES}`, {
        params: { phone: phone },
      });
      setLoading(false);

      switch (response.data.status) {
        case 0:
          if (response.data.bonusCount === 0) {
            setCheckBonuses(true);
          } else {
            const response = await API().api(
              `${ApiUrl.CONFIRM_PHONE_BONUSES}`,
              {
                params: { phone: phone },
              }
            );

            setCookie('bonusesCode', response.data);
            setConfirmPhone(true);
          }
          setQuantity(parseFloat(response.data.bonusCount));

          break;
        case 1:
        case 2:
          return NotificationAlert('error', response.data.message);
      }
    } catch (error: any) {
      console.log(error);
      setDisabled(true);
      setReFetch(true);
      setTimer(error.response.data.time);
      // return NotificationAlert('error', error.response.data.message);
    }
  };

  const sendCode = async () => {
    const hashCode = getCookie('bonusesCode');
    const response = await API().api(`${ApiUrl.CHECK_BONUSES_CODE}`, {
      params: { code: code.value, hashCode: hashCode },
    });
    if (response.data === true) {
      setConfirmPhone(false);
      setCheckBonuses(true);
    } else {
      return NotificationAlert('error', 'Неверный код подтверждения');
    }
  };

  const onTimerFinish = () => {
    setConfirmPhone(false);
  };

  const onTimerReFetchFinish = () => {
    setReFetch(false);
    setDisabled(false);
  };

  return (
    <MetaLayout title="Бонусная программа">
      <div className="bonusnayaProgramma">
        <Breadcrumbs
          items={[
            { title: 'Главная', href: '/' },
            {
              title: 'Бонусная программа',
            },
          ]}
        />
        <div className="container">
          <section className="bonuses">
            <div className="bonuses__head">
              <div className="bonuses__title-wrap">
                <i className="ico-gift"></i>
                <h2 className="bonuses__title"> БОНУСНАЯ ПРОГРАММА</h2>
              </div>
              <p className="bonuses__subtitle">
                Каждый бонусный балл превращается в 1 рубль скидки!
              </p>
            </div>
            <div className="bonuses__list">
              <div className="bonus" onClick={handleAnimation}>
                <Collapse
                  defaultActiveKey={['1']}
                  expandIcon={() => <i className="ico ico-plus"></i>}
                  expandIconPosition={'end'}
                >
                  <Panel
                    key="1"
                    header={
                      <div className="accordion bonuses-accordion--main">
                        <p className="accordion__title bonuses-accordion__title">
                          Проверить количество бонусов
                        </p>
                      </div>
                    }
                  >
                    <div className="accordion__content bonuses-accordion__content accordion__content--active bonuses">
                      {confirmPhone ? (
                        <div className="d-flex flex-column align-items-center ">
                          <h2 className={styles.checkBonusesTitle}>
                            ВАШЕ КОЛИЧЕСТВО БОНУСОВ
                          </h2>
                          <p className="text-center mt-10 mb-10">
                            Для того чтобы увидеть баланс Ваших бонусов,
                            необходимо указать номер телефона и пройти процедуру
                            подтверждения номера. Зарегистрируйтесь на сайте,
                            чтобы получать бонусы, если вы новый клиент.
                          </p>
                          <div className="text-center mt-10 mb-10">
                            На номер <b>{phoneInput.value}</b> (
                            <Link
                              href=""
                              onClick={() => {
                                setConfirmPhone(false);
                              }}
                            >
                              изменить
                            </Link>
                            ) отправленно SMS, введите код подтверждения из SMS.
                            Код будет активен ещё
                            <div className={styles.timer}>
                              <div className="d-flex">
                                <Countdown
                                  format={'mm:ss'}
                                  value={Date.now() + 1000 * 60 * 5}
                                  onFinish={onTimerFinish}
                                />
                                <span className="ml-8">мин.</span>
                              </div>
                            </div>
                          </div>
                          <Form onFinish={sendCode}>
                            <div className="position-relative">
                              <div className={styles.inputWrap}>
                                <span className={styles.phoneSpan}>Код</span>
                                <Form.Item
                                  name="code"
                                  valuePropName="option"
                                  rules={[
                                    {
                                      required: true,
                                      validator: (_, e) => {
                                        return e.target.value.length === 4
                                          ? Promise.resolve()
                                          : Promise.reject('');
                                      },
                                      message: 'Пожалуйста введите 4 цифры',
                                    },
                                  ]}
                                >
                                  <Input
                                    type="tel"
                                    className={styles.phoneInput}
                                    {...code.forInput}
                                  />
                                </Form.Item>
                                <Form.Item>
                                  <Button
                                    htmlType={'submit'}
                                    type="primary"
                                    loading={loading}
                                    className={styles.phoneButton}
                                  >
                                    Отправить
                                  </Button>
                                </Form.Item>
                              </div>
                            </div>
                          </Form>
                        </div>
                      ) : checkBonuses ? (
                        <div className="d-flex flex-column align-items-center ">
                          <h2 className={styles.checkBonusesTitle}>
                            ВАШЕ КОЛИЧЕСТВО БОНУСОВ
                          </h2>
                          <div className="d-flex align-items-center mb-20">
                            <span>Ваш баланс</span>
                            <div className={styles.checkBonusesQuantity}>
                              {quantity}
                            </div>
                            <span>{declOfNumBonuses(Number(quantity))}</span>
                          </div>
                          <Button
                            type="primary"
                            onClick={() => {
                              setCheckBonuses(false);
                            }}
                            className={styles.checkBonusesButton}
                          >
                            Посмотреть баланс по другому номеру телефона
                          </Button>
                        </div>
                      ) : (
                        <div className="d-flex  flex-column">
                          <p className="m-0">
                            Для того чтобы увидеть баланс Ваших бонусов,
                            необходимо указать номер телефона и пройти процедуру
                            подтверждения номера. Зарегистрируйтесь на сайте,
                            чтобы получать бонусы, если вы новый клиент.
                          </p>
                          <Form>
                            <div className="position-relative">
                              <div className={styles.inputWrap}>
                                <span
                                  className={styles.phoneSpan}
                                  style={{ paddingBottom: 0 }}
                                >
                                  Введите ваш телефон
                                </span>
                                <Form.Item
                                  name="phone"
                                  valuePropName="option"
                                  style={{ marginBottom: 0 }}
                                  rules={[
                                    {
                                      validator: (_, e) => {
                                        return e.target.value.replace(/\D/g, '')
                                          .length === 11
                                          ? Promise.resolve()
                                          : Promise.reject('');
                                      },
                                      message: <>Введите корректный номер</>,
                                    },
                                  ]}
                                >
                                  <Input
                                    type="tel"
                                    className={styles.phoneInput}
                                    placeholder={'+7 ( ___ ) ___ - __ - __'}
                                    {...phoneInput.forInput}
                                  />
                                </Form.Item>
                                <Form.Item style={{ marginBottom: 0 }}>
                                  <Button
                                    type="primary"
                                    loading={loading}
                                    disabled={disabled}
                                    className={styles.phoneButton}
                                    onClick={onFinish}
                                  >
                                    Отправить
                                  </Button>
                                </Form.Item>
                              </div>
                            </div>
                            {reFetch && (
                              <div
                                className={'errorMessage'}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <div> Отправить повторно, через</div>
                                <div>
                                  <Countdown
                                    format={'s'}
                                    value={timer}
                                    onFinish={onTimerReFetchFinish}
                                  />
                                </div>
                                <div className="ml-8">сек</div>
                              </div>
                            )}
                            <p className={styles.smsConfirm}>
                              Вам будет отправлено SMS сообщение с кодом
                              подтверждения, на номер телефона введенный в поле
                              выше.
                            </p>
                          </Form>
                        </div>
                      )}
                    </div>
                  </Panel>
                </Collapse>
              </div>
              <h3 className={styles.bonusTitle}>Бонусная программа</h3>
              <div
                className="bonus bonuses-accordion"
                onClick={handleAnimation}
              >
                <Collapse
                  expandIcon={() => <i className="ico ico-plus"></i>}
                  expandIconPosition={'end'}
                >
                  <Panel
                    key="2"
                    header={
                      <p className="accordion__title bonuses-accordion__title">
                        Что такое бонусная программа 1=1?
                      </p>
                    }
                  >
                    <div className="accordion__content bonuses-accordion__content">
                      За каждую покупку в розничных магазинах и
                      интернет-магазине Сеть Техники мы начисляем на счёт своих
                      покупателей бонусные рубли, которые затем можно потратить
                      на следующие покупки.
                    </div>
                  </Panel>
                </Collapse>
              </div>
              <div
                className="bonus bonuses-accordion"
                onClick={handleAnimation}
              >
                <Collapse
                  expandIcon={() => <i className="ico ico-plus"></i>}
                  expandIconPosition={'end'}
                >
                  <Panel
                    key="3"
                    header={
                      <p className="accordion__title bonuses-accordion__title">
                        Как стать членом бонусной программы?
                      </p>
                    }
                  >
                    <div className="accordion__content bonuses-accordion__content">
                      Для того, чтобы получать бонусные рубли, вам нужно
                      получить клубную карту в любом из наших магазинов.
                    </div>
                  </Panel>
                </Collapse>
              </div>
              <div
                className="bonus bonuses-accordion"
                onClick={handleAnimation}
              >
                <Collapse
                  expandIcon={() => <i className="ico ico-plus"></i>}
                  expandIconPosition={'end'}
                >
                  <Panel
                    key="4"
                    header={
                      <p className="accordion__title bonuses-accordion__title">
                        Сколько бонусов я получу за покупки?
                      </p>
                    }
                  >
                    <div className="accordion__content bonuses-accordion__content">
                      В зависимости от выбранного товара количество бонусных
                      рублей может отличаться. По умолчанию мы начисляем 3% от
                      стоимости товара. На странице товара рядом с ценой, а так
                      же на ценнике в розничном магазине указано количество
                      бонусов, которые вы получите.
                    </div>
                  </Panel>
                </Collapse>
              </div>
              <div
                className="bonus bonuses-accordion"
                onClick={handleAnimation}
              >
                <Collapse
                  expandIcon={() => <i className="ico ico-plus"></i>}
                  expandIconPosition={'end'}
                >
                  <Panel
                    key="5"
                    header={
                      <p className="accordion__title bonuses-accordion__title">
                        Когда мне будут начислены бонусы за покупку?
                      </p>
                    }
                  >
                    <div className="accordion__content bonuses-accordion__content">
                      Бонусы за покупку начисляются сразу же после совершения
                      покупки (или при выкупе заказа интернет-магазина), но
                      активными они становятся спустя 3 дня.
                    </div>
                  </Panel>
                </Collapse>
              </div>
              <div
                className="bonus bonuses-accordion"
                onClick={handleAnimation}
              >
                <Collapse
                  expandIcon={() => <i className="ico ico-plus"></i>}
                  expandIconPosition={'end'}
                >
                  <Panel
                    key="6"
                    header={
                      <p className="accordion__title bonuses-accordion__title">
                        Что будет с бонусами, если я вернул купленный товар
                      </p>
                    }
                  >
                    <div className="accordion__content bonuses-accordion__content">
                      При возврате товара, купленного с использованием бонусов,
                      все использованные бонусы возвращаются на счёт покупателя.
                    </div>
                  </Panel>
                </Collapse>
              </div>
              <div
                className="bonus bonuses-accordion"
                onClick={handleAnimation}
              >
                <Collapse
                  expandIcon={() => <i className="ico ico-plus"></i>}
                  expandIconPosition={'end'}
                >
                  <Panel
                    key="7"
                    header={
                      <p className="accordion__title bonuses-accordion__title">
                        Как мне узнать сколько бонусов на моём счёте?
                      </p>
                    }
                  >
                    <div className="accordion__content bonuses-accordion__content">
                      Узнать о количестве накопленных бонусов можно в личном
                      кабинете на сайте, а так же в любом розничном магазине или
                      по телефону горячей линии 8 800 775 20 30.
                    </div>
                  </Panel>
                </Collapse>
              </div>
              <h3 className={styles.bonusTitle}>
                Способы получения бонусных баллов
              </h3>
              <div
                className="bonus bonuses-accordion"
                onClick={handleAnimation}
              >
                <Collapse
                  expandIcon={() => <i className="ico ico-plus"></i>}
                  expandIconPosition={'end'}
                >
                  <Panel
                    key="8"
                    header={
                      <p className="accordion__title bonuses-accordion__title">
                        За покупки в магазинах и интернет-магазине
                      </p>
                    }
                  >
                    <div className="accordion__content bonuses-accordion__content">
                      Это основной способ получить бонусные рубли на Ваш счёт.
                      Совершайте покупки и копите бонусы для получения скидки.
                    </div>
                  </Panel>
                </Collapse>
              </div>
              <div
                className="bonus bonuses-accordion"
                onClick={handleAnimation}
              >
                <Collapse
                  expandIcon={() => <i className="ico ico-plus"></i>}
                  expandIconPosition={'end'}
                >
                  <Panel
                    key="9"
                    header={
                      <p className="accordion__title bonuses-accordion__title">
                        За совершение определённых действий
                      </p>
                    }
                  >
                    <div className="accordion__content bonuses-accordion__content">
                      Вы можете получать бонусные рубли во время проведения
                      специальных промо-акций, когда мы начисляем бонусы за
                      различные действия, например - написание отзыва, указание
                      дополнительной информации о вас и другие. Следите за
                      обновлениями.
                    </div>
                  </Panel>
                </Collapse>
              </div>
              <h3 className={styles.bonusTitle}>
                FAQ или часто задаваемые вопросы
              </h3>
              <div
                className="bonus bonuses-accordion"
                onClick={handleAnimation}
              >
                <Collapse
                  expandIcon={() => <i className="ico ico-plus"></i>}
                  expandIconPosition={'end'}
                >
                  <Panel
                    key="10"
                    header={
                      <p className="accordion__title bonuses-accordion__title">
                        Действуют ли бонусные баллы для покупок в магазинах?
                      </p>
                    }
                  >
                    <div className="accordion__content bonuses-accordion__content">
                      Бонусные рубли доступны для списания на покупки как в
                      розничных магазинах, так и интернет-магазине
                    </div>
                  </Panel>
                </Collapse>
              </div>
              <div
                className="bonus bonuses-accordion"
                onClick={handleAnimation}
              >
                <Collapse
                  expandIcon={() => <i className="ico ico-plus"></i>}
                  expandIconPosition={'end'}
                >
                  <Panel
                    key="11"
                    header={
                      <p className="accordion__title bonuses-accordion__title">
                        Можно ли участвовать в бонусной программе, делая заказы
                        через терминал в магазине?
                      </p>
                    }
                  >
                    <div className="accordion__content bonuses-accordion__content">
                      Да, можно, так как бонусы начисляются в момент покупки а
                      не заказа. При этом вам нужно иметь клубную карту
                      компании.
                    </div>
                  </Panel>
                </Collapse>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MetaLayout>
  );
};

export default Bonuses;

export const getServerSideProps: GetServerSideProps =
  wrapper.getServerSideProps((store) => {
    return async (ctx) => {
      const dispatch = store.dispatch;
      const { user, isAuth } = store.getState().auth;

      const bonuses: any = {};

      if (isAuth && user?.id) {
        const data = await dispatch(await fetchUser(user?.id, ctx));
        if (data.phone) {
          const response = await API(ctx).api(
            `${ApiUrl.SERVER_PUBLIC_DOMAIN}${ApiUrl.CHECK_BONUSES}`,
            { params: { phone: data.phone } }
          );
          switch (response.data.status) {
            case 0:
              bonuses.isRegistered = true;
              bonuses.bonusCount = parseFloat(response.data.bonusCount);
              if (data.phoneConfirm === null || data.phoneConfirm === false) {
                bonuses.isRegistered = false;
              }
              break;
            case 2:
              bonuses.isRegistered = false;
              break;
          }
        }
      }

      return { props: { data: bonuses } };
    };
  });
