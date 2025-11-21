import { getLatestState, getPlayerId, sendTankChoice } from './network.js';

export function setupTankUi() {
  const overlay = document.createElement('div');
  overlay.id = 'tank-choice-overlay';

  const title = document.createElement('h3');
  title.textContent = 'Choose your tank upgrade';
  overlay.appendChild(title);

  const choicesContainer = document.createElement('div');
  choicesContainer.id = 'tank-choice-buttons';
  overlay.appendChild(choicesContainer);

  document.body.appendChild(overlay);

  function renderChoices(choices) {
    choicesContainer.innerHTML = '';
    choices.forEach((choice) => {
      const button = document.createElement('button');
      button.textContent = choice.name || choice.id;
      button.addEventListener('click', () => sendTankChoice(choice.id));
      choicesContainer.appendChild(button);
    });
  }

  function update() {
    const state = getLatestState();
    const player = state?.players?.find((p) => p.id === getPlayerId());
    const choices = player?.pendingTankChoices || [];

    if (choices.length > 0) {
      renderChoices(choices);
      overlay.style.display = 'flex';
    } else {
      overlay.style.display = 'none';
    }

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}
